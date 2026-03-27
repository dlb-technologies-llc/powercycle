import { expect, test } from "@playwright/test";

// API requests use Playwright's baseURL from config (relative paths)

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

type ApiRequest = {
	post: (
		url: string,
		options?: { data?: unknown },
	) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
	get: (
		url: string,
	) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }>;
};

/**
 * Create a cycle and start a workout via API calls.
 * Returns the workout ID and the workout plan.
 */
async function setupWorkout(request: ApiRequest) {
	// Step 1: Create a cycle with 1RM values
	const cycleRes = await request.post(`/api/cycles`, {
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
	const planRes = await request.get(`/api/workouts/next`);
	expect(planRes.ok()).toBeTruthy();
	const plan = (await planRes.json()) as WorkoutPlan;
	expect(plan).not.toBeNull();

	// Step 3: Start a workout
	const workoutRes = await request.post(`/api/workouts`, {
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

/** Navigate through overview to ready phase */
async function startWorkoutFromOverview(
	page: import("@playwright/test").Page,
	workoutId: string,
) {
	await page.goto(`/workout?id=${workoutId}`);
	const startWorkoutBtn = page.getByRole("button", {
		name: "Start Workout",
	});
	await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });
	await startWorkoutBtn.click();
}

/** Complete one set cycle: Ready (if first) → Active → Resting → fill reps → Next */
async function completeOneSet(
	page: import("@playwright/test").Page,
	options: { isFirstOfExercise: boolean; reps?: string },
) {
	if (options.isFirstOfExercise) {
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		await expect(startSetBtn).toBeVisible();
		await startSetBtn.click();
	}

	const doneBtn = page.getByRole("button", { name: "Done" });
	await expect(doneBtn).toBeVisible();
	await doneBtn.click();

	await expect(page.getByText("Rest Timer")).toBeVisible();
	const repsInput = page.getByPlaceholder("Reps");
	await repsInput.fill(options.reps ?? "5");

	const nextBtn = page.getByRole("button", { name: /Next Set|Finish/ });
	await expect(nextBtn).toBeVisible();
	await nextBtn.click();
}

// Each test creates its own workout to avoid shared state contamination
test.describe("Workout Flow", () => {
	test("phase transitions: overview -> ready -> active -> resting", async ({
		page,
		request,
	}) => {
		const { workout } = await setupWorkout(request as unknown as ApiRequest);
		await startWorkoutFromOverview(page, workout.id);

		// Ready phase: should see "Start Set" button
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		await expect(startSetBtn).toBeVisible();
		await startSetBtn.click();

		// Active phase: should see "Set Timer" label and "Done" button
		await expect(page.getByText("Set Timer")).toBeVisible();
		const doneBtn = page.getByRole("button", { name: "Done" });
		await expect(doneBtn).toBeVisible();
		await doneBtn.click();

		// Resting phase: should see "Rest Timer" and input fields
		await expect(page.getByText("Rest Timer")).toBeVisible();
		await expect(page.getByPlaceholder("Weight")).toBeVisible();
		await expect(page.getByPlaceholder("Reps")).toBeVisible();
	});

	test("exercise transition shows NEXT UP label", async ({ page, request }) => {
		const { workout, plan } = await setupWorkout(
			request as unknown as ApiRequest,
		);
		await startWorkoutFromOverview(page, workout.id);

		// Complete all main lift sets to trigger exercise transition
		const mainLiftSetCount = plan.mainLiftSets.length;
		for (let i = 0; i < mainLiftSetCount; i++) {
			await completeOneSet(page, { isFirstOfExercise: i === 0 });
		}

		// After completing all main lift sets, should see "Next Up" for variation
		await expect(page.getByText("Next Up")).toBeVisible();
	});

	test("timer labels: SET TIMER in active, REST TIMER in resting", async ({
		page,
		request,
	}) => {
		const { workout } = await setupWorkout(request as unknown as ApiRequest);
		await startWorkoutFromOverview(page, workout.id);

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
		request,
	}) => {
		const { workout, plan } = await setupWorkout(
			request as unknown as ApiRequest,
		);
		await startWorkoutFromOverview(page, workout.id);

		// Navigate through main lift sets to reach variation (which has RPE inputs)
		const mainLiftSetCount = plan.mainLiftSets.length;
		for (let i = 0; i < mainLiftSetCount; i++) {
			await completeOneSet(page, { isFirstOfExercise: i === 0 });
		}

		// Now at variation Ready phase with "Next Up"
		await expect(page.getByText("Next Up")).toBeVisible();
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		await startSetBtn.click();

		// Active phase for variation
		const doneBtn = page.getByRole("button", { name: "Done" });
		await expect(doneBtn).toBeVisible();
		await doneBtn.click();

		// Resting phase — should have RPE input
		await expect(page.getByText("Rest Timer")).toBeVisible();
		const rpeInput = page.getByPlaceholder("RPE");
		await expect(rpeInput).toBeVisible();

		// Enter out-of-range RPE
		await rpeInput.fill("15");

		// Verify error message
		await expect(page.getByText(/RPE must be 1-10/)).toBeVisible();
	});

	test("save weight toggle visible on last set of accessory", async ({
		page,
		request,
	}) => {
		const { workout, plan } = await setupWorkout(
			request as unknown as ApiRequest,
		);
		await startWorkoutFromOverview(page, workout.id);

		// Navigate through main lift sets
		for (let i = 0; i < plan.mainLiftSets.length; i++) {
			await completeOneSet(page, { isFirstOfExercise: i === 0 });
		}

		// Navigate through variation sets
		for (let i = 0; i < plan.variation.sets.length; i++) {
			if (i === 0) {
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
			if (i === plan.variation.sets.length - 1) {
				await expect(page.getByText(/Save weight for next time/)).toBeVisible();
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
		request,
	}) => {
		const { workout } = await setupWorkout(request as unknown as ApiRequest);
		await startWorkoutFromOverview(page, workout.id);

		// Ready -> Active -> Resting (first set)
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		await expect(startSetBtn).toBeVisible();
		await startSetBtn.click();

		const doneBtn = page.getByRole("button", { name: "Done" });
		await doneBtn.click();

		// In Resting phase, progress bar should show "Set 1 of N"
		await expect(page.getByText(/Set 1 of \d+/)).toBeVisible();

		// Complete the first set and move to the second
		const repsInput = page.getByPlaceholder("Reps");
		await repsInput.fill("5");
		const nextBtn = page.getByRole("button", { name: /Next Set/ });
		await nextBtn.click();

		// Second set — same exercise skips Ready, goes to Active
		const doneBtn2 = page.getByRole("button", { name: "Done" });
		await expect(doneBtn2).toBeVisible();
		await doneBtn2.click();

		// Progress should now show "Set 2 of N"
		await expect(page.getByText(/Set 2 of \d+/)).toBeVisible();
	});

	test("data pre-fill: main lifts show prescribed weight/reps in set breakdown", async ({
		page,
		request,
	}) => {
		const { workout, plan } = await setupWorkout(
			request as unknown as ApiRequest,
		);
		await page.goto(`/workout?id=${workout.id}`);

		const startWorkoutBtn = page.getByRole("button", {
			name: "Start Workout",
		});
		await expect(startWorkoutBtn).toBeVisible({ timeout: 15000 });

		// In overview, main lift sets should display weight and reps
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

		// Also verify in Ready phase
		await startWorkoutBtn.click();
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
		const setup = await setupWorkout(request as unknown as ApiRequest);
		const { workout, plan: workoutPlan } = setup;

		// Log 2 sets via API before navigating
		for (let i = 0; i < 2; i++) {
			const mainSet = workoutPlan.mainLiftSets[i];
			if (!mainSet) break;
			const logRes = await request.post(`/api/workouts/${workout.id}/sets`, {
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
			});
			expect(logRes.ok()).toBeTruthy();
		}

		// Navigate to the workout page
		await page.goto(`/workout?id=${workout.id}`);

		// Should resume — NOT show overview. Should see Ready or Active phase
		const startSetBtn = page.getByRole("button", { name: "Start Set" });
		const setTimerLabel = page.getByText("Set Timer");

		await expect(startSetBtn.or(setTimerLabel)).toBeVisible({
			timeout: 15000,
		});

		// Confirm we are NOT at the overview
		await expect(
			page.getByRole("button", { name: "Start Workout" }),
		).not.toBeVisible();
	});
});
