import { expect, test } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

interface CycleResponse {
	id: string;
	currentRound: number;
	currentDay: number;
}

interface WorkoutPlan {
	day: number;
	round: number;
	cycle: number;
	mainLift: string;
	mainLiftSets: Array<{
		setNumber: number;
		weight: number;
		reps: number;
		percentage: number;
		isAmrap: boolean;
	}>;
	variation: {
		category: string;
		defaultExercise: string;
		sets: Array<{
			setNumber: number;
			rpeMin: number;
			rpeMax: number;
			repMin: number;
			repMax: number;
		}>;
	};
	accessories: Array<{
		category: string;
		defaultExercise: string;
		sets: Array<{
			setNumber: number;
			rpeMin: number;
			rpeMax: number;
			repMin: number;
			repMax: number;
		}>;
	}>;
}

interface WorkoutResponse {
	id: string;
	cycleId: string;
	round: number;
	day: number;
}

/**
 * Create a cycle and start a workout via API calls.
 * Returns the workout ID and the workout plan.
 */
async function setupWorkout(request: {
	post: (
		url: string,
		options?: { data?: unknown },
	) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
	get: (
		url: string,
	) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
}) {
	// Step 1: Create a cycle with 1RM values
	const cycleRes = await request.post(`${BASE_URL}/api/cycles`, {
		data: {
			squat: 300,
			bench: 225,
			deadlift: 405,
			ohp: 135,
			unit: "lbs",
		},
	});
	expect(cycleRes.ok()).toBeTruthy();
	const cycle = (await cycleRes.json()) as CycleResponse;

	// Step 2: Fetch the workout plan
	const planRes = await request.get(`${BASE_URL}/api/workouts/next`);
	expect(planRes.ok()).toBeTruthy();
	const plan = (await planRes.json()) as WorkoutPlan;
	expect(plan).not.toBeNull();

	// Step 3: Start a workout
	const workoutRes = await request.post(`${BASE_URL}/api/workouts`, {
		data: {
			cycleId: cycle.id,
			round: plan.round,
			day: plan.day,
		},
	});
	expect(workoutRes.ok()).toBeTruthy();
	const workout = (await workoutRes.json()) as WorkoutResponse;

	return { cycle, plan, workout };
}

test.describe
	.serial("Workout Flow", () => {
		let workoutId: string;
		let plan: WorkoutPlan;

		test.beforeAll(async ({ request }) => {
			const setup = await setupWorkout(
				request as unknown as Parameters<typeof setupWorkout>[0],
			);
			workoutId = setup.workout.id;
			plan = setup.plan;
		});

		test("phase transitions: overview -> ready -> active -> resting", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			// Wait for overview to load — should see the "Start Workout" button
			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });

			// Click Start Workout to enter Ready phase
			await startWorkoutBtn.click();

			// Ready phase: should see exercise name and "Start Set" button
			const startSetBtn = page.getByRole("button", { name: "Start Set" });
			await expect(startSetBtn).toBeVisible();

			// Click Start Set to enter Active phase
			await startSetBtn.click();

			// Active phase: should see "Set Timer" label and "Done" button
			await expect(page.getByText("Set Timer")).toBeVisible();
			const doneBtn = page.getByRole("button", { name: "Done" });
			await expect(doneBtn).toBeVisible();

			// Click Done to enter Resting phase
			await doneBtn.click();

			// Resting phase: should see "Rest Timer" and input fields
			await expect(page.getByText("Rest Timer")).toBeVisible();
			await expect(page.getByPlaceholder("Weight")).toBeVisible();
			await expect(page.getByPlaceholder("Reps")).toBeVisible();
		});

		test("exercise transition shows NEXT UP label", async ({ page }) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
			await startWorkoutBtn.click();

			// We need to go through all sets of the first exercise (main lift)
			// to trigger an exercise transition to the next exercise.
			const mainLiftSetCount = plan.mainLiftSets.length;

			// Complete each main lift set
			for (let i = 0; i < mainLiftSetCount; i++) {
				// Ready phase on first set, Active on subsequent (same exercise skips ready)
				if (i === 0) {
					const startSetBtn = page.getByRole("button", { name: "Start Set" });
					await expect(startSetBtn).toBeVisible();
					await startSetBtn.click();
				}

				// Active phase
				const doneBtn = page.getByRole("button", { name: "Done" });
				await expect(doneBtn).toBeVisible();
				await doneBtn.click();

				// Resting phase — fill in reps and continue
				await expect(page.getByText("Rest Timer")).toBeVisible();
				const repsInput = page.getByPlaceholder("Reps");
				await repsInput.fill("5");

				const nextBtn = page.getByRole("button", { name: /Next Set|Finish/ });
				await expect(nextBtn).toBeVisible();
				await nextBtn.click();
			}

			// After completing all main lift sets, we should be at the variation exercise
			// which is a new exercise — should show "Next Up" label
			await expect(page.getByText("Next Up")).toBeVisible();
		});

		test("timer labels: SET TIMER in active, REST TIMER in resting", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
			await startWorkoutBtn.click();

			// Ready -> Active
			const startSetBtn = page.getByRole("button", { name: "Start Set" });
			await expect(startSetBtn).toBeVisible();
			await startSetBtn.click();

			// Active: verify "Set Timer" label
			await expect(page.getByText("Set Timer")).toBeVisible();

			// Active -> Resting
			const doneBtn = page.getByRole("button", { name: "Done" });
			await doneBtn.click();

			// Resting: verify "Rest Timer" label
			await expect(page.getByText("Rest Timer")).toBeVisible();
		});

		test("RPE validation shows error for out-of-range value", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
			await startWorkoutBtn.click();

			// Navigate through main lift sets to reach a variation/accessory set
			// which has RPE inputs
			const mainLiftSetCount = plan.mainLiftSets.length;

			for (let i = 0; i < mainLiftSetCount; i++) {
				if (i === 0) {
					const startSetBtn = page.getByRole("button", { name: "Start Set" });
					await expect(startSetBtn).toBeVisible();
					await startSetBtn.click();
				}

				const doneBtn = page.getByRole("button", { name: "Done" });
				await expect(doneBtn).toBeVisible();
				await doneBtn.click();

				const repsInput = page.getByPlaceholder("Reps");
				await repsInput.fill("5");

				const nextBtn = page.getByRole("button", { name: /Next Set|Finish/ });
				await nextBtn.click();
			}

			// Now at the variation exercise (Ready phase with "Next Up")
			await expect(page.getByText("Next Up")).toBeVisible();
			const startSetBtn = page.getByRole("button", { name: "Start Set" });
			await startSetBtn.click();

			// Active phase for variation
			const doneBtn = page.getByRole("button", { name: "Done" });
			await expect(doneBtn).toBeVisible();
			await doneBtn.click();

			// Resting phase — should have RPE input for variation/accessory exercises
			await expect(page.getByText("Rest Timer")).toBeVisible();
			const rpeInput = page.getByPlaceholder("RPE");
			await expect(rpeInput).toBeVisible();

			// Enter an out-of-range RPE value
			await rpeInput.fill("15");

			// Verify error message appears
			await expect(page.getByText(/RPE must be 1-10/)).toBeVisible();
		});

		test("save weight toggle visible on last set of accessory", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
			await startWorkoutBtn.click();

			// Navigate through main lift sets
			const mainLiftSetCount = plan.mainLiftSets.length;
			for (let i = 0; i < mainLiftSetCount; i++) {
				if (i === 0) {
					const startSetBtn = page.getByRole("button", { name: "Start Set" });
					await expect(startSetBtn).toBeVisible();
					await startSetBtn.click();
				}
				const doneBtn = page.getByRole("button", { name: "Done" });
				await expect(doneBtn).toBeVisible();
				await doneBtn.click();
				const repsInput = page.getByPlaceholder("Reps");
				await repsInput.fill("5");
				const nextBtn = page.getByRole("button", { name: /Next Set|Finish/ });
				await nextBtn.click();
			}

			// Navigate through variation sets
			const variationSetCount = plan.variation.sets.length;
			for (let i = 0; i < variationSetCount; i++) {
				if (i === 0) {
					// First variation set shows Ready with "Next Up"
					const startSetBtn = page.getByRole("button", { name: "Start Set" });
					await expect(startSetBtn).toBeVisible();
					await startSetBtn.click();
				}
				const doneBtn = page.getByRole("button", { name: "Done" });
				await expect(doneBtn).toBeVisible();
				await doneBtn.click();
				const repsInput = page.getByPlaceholder("Reps");
				await repsInput.fill("8");

				// On the last set of the variation (non-main-lift), check for save weight toggle
				if (i === variationSetCount - 1) {
					await expect(
						page.getByText(/Save weight for next time/),
					).toBeVisible();
				}

				const nextBtn = page.getByRole("button", { name: /Next Set|Finish/ });
				await nextBtn.click();
			}

			// If there are accessories, navigate to the last set of the first accessory
			if (plan.accessories.length > 0) {
				const firstAccessory = plan.accessories[0];
				const accSetCount = firstAccessory.sets.length;

				for (let i = 0; i < accSetCount; i++) {
					if (i === 0) {
						const startSetBtn = page.getByRole("button", {
							name: "Start Set",
						});
						await expect(startSetBtn).toBeVisible();
						await startSetBtn.click();
					}
					const doneBtn = page.getByRole("button", { name: "Done" });
					await expect(doneBtn).toBeVisible();
					await doneBtn.click();
					const repsInput = page.getByPlaceholder("Reps");
					await repsInput.fill("10");

					if (i === accSetCount - 1) {
						// Last set of accessory — should show save weight toggle
						await expect(
							page.getByText(/Save weight for next time/),
						).toBeVisible();
					}

					const nextBtn = page.getByRole("button", {
						name: /Next Set|Finish/,
					});
					await nextBtn.click();
				}
			}
		});

		test("progress bar shows Set X of Y and updates after completing a set", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
			await startWorkoutBtn.click();

			// Ready -> Active -> Resting (first set)
			const startSetBtn = page.getByRole("button", { name: "Start Set" });
			await expect(startSetBtn).toBeVisible();
			await startSetBtn.click();

			const doneBtn = page.getByRole("button", { name: "Done" });
			await doneBtn.click();

			// In Resting phase, the progress bar should be visible
			// It shows "Set X of Y" — first set should show "Set 1 of N"
			await expect(page.getByText(/Set 1 of \d+/)).toBeVisible();

			// Complete the first set and move to the second
			const repsInput = page.getByPlaceholder("Reps");
			await repsInput.fill("5");
			const nextBtn = page.getByRole("button", { name: /Next Set/ });
			await nextBtn.click();

			// Second set — should go directly to Active for same exercise
			// Then Done -> Resting
			const doneBtn2 = page.getByRole("button", { name: "Done" });
			await expect(doneBtn2).toBeVisible();
			await doneBtn2.click();

			// Progress should now show "Set 2 of N"
			await expect(page.getByText(/Set 2 of \d+/)).toBeVisible();
		});

		test("data pre-fill: main lifts show prescribed weight/reps in set breakdown", async ({
			page,
		}) => {
			await page.goto(`/workout?id=${workoutId}`);

			const startWorkoutBtn = page.getByRole("button", {
				name: "Start Workout",
			});
			await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });

			// In the overview, the main lift sets should display weight and reps
			// e.g., "Set 1: 195 lbs x 5"
			if (plan.mainLiftSets.length > 0) {
				const firstSet = plan.mainLiftSets[0];
				// The overview shows "Set N: WEIGHT lbs x REPS" format
				await expect(
					page.getByText(
						new RegExp(
							`Set ${firstSet.setNumber}.*${firstSet.weight}.*${firstSet.reps}`,
						),
					),
				).toBeVisible();
			}

			// Also verify in the Ready phase after starting the workout
			await startWorkoutBtn.click();

			// Ready phase should show set breakdown with weight/reps
			if (plan.mainLiftSets.length > 0) {
				const firstSet = plan.mainLiftSets[0];
				await expect(
					page.getByText(
						new RegExp(
							`Set ${firstSet.setNumber}.*${firstSet.weight}.*${firstSet.reps}`,
						),
					),
				).toBeVisible();
			}
		});
	});

test.describe("Workout Resume", () => {
	test("resumes at next unlogged set after page reload", async ({
		page,
		request,
	}) => {
		// Create a fresh workout for the resume test
		const setup = await setupWorkout(
			request as unknown as Parameters<typeof setupWorkout>[0],
		);
		const { workout, plan: workoutPlan } = setup;

		// Log 2 sets via API before navigating
		for (let i = 0; i < 2; i++) {
			const mainSet = workoutPlan.mainLiftSets[i];
			if (!mainSet) break;
			const logRes = await request.post(
				`${BASE_URL}/api/workouts/${workout.id}/sets`,
				{
					data: {
						exerciseName:
							workoutPlan.mainLift === "squat"
								? "Squat"
								: workoutPlan.mainLift === "bench"
									? "Bench Press"
									: workoutPlan.mainLift === "deadlift"
										? "Deadlift"
										: "Overhead Press",
						setNumber: mainSet.setNumber,
						prescribedWeight: mainSet.weight,
						actualWeight: mainSet.weight,
						prescribedReps: mainSet.reps,
						actualReps: mainSet.reps,
						rpe: null,
						prescribedRpeMin: null,
						prescribedRpeMax: null,
						isMainLift: true,
						isAmrap: mainSet.isAmrap,
						setDuration: 30,
						restDuration: 60,
						category: null,
					},
				},
			);
			expect(logRes.ok()).toBeTruthy();
		}

		// Navigate to the workout page
		await page.goto(`/workout?id=${workout.id}`);

		// It should resume and NOT show the overview (Start Workout button)
		// Instead it should show a Ready or Active phase
		// Since we logged 2 sets, it should be at set 3 (the next unlogged set)

		// Wait for the page to finish loading and resume check
		// Should NOT see "Start Workout" button (that's the overview phase)
		// Should see either "Start Set" (ready) or "Set Timer"/"Done" (active)
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		const setTimerLabel = page.getByText("Set Timer");

		// Wait for either Ready or Active phase to appear
		await expect(startSetBtn.or(setTimerLabel)).toBeVisible({ timeout: 15000 });

		// Confirm we are NOT at the overview
		await expect(
			page.getByRole("button", { name: "Start Workout" }),
		).not.toBeVisible();
	});
});
