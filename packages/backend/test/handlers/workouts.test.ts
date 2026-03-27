import { describe, expect, it } from "@effect/vitest";
import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { Effect } from "effect";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

const TEST_USER_ID = "00000000-0000-4000-a000-000000000001";
const TEST_CYCLE_ID = "00000000-0000-4000-a000-000000000002";
const TEST_WORKOUT_ID = "00000000-0000-4000-a000-000000000003";

describe("workouts handler logic", () => {
	it.effect("creates workout entity", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const entity = yield* service.createEntity(
				TEST_USER_ID,
				TEST_CYCLE_ID,
				1,
				1,
			);
			expect(entity.id).toBeDefined();
			expect(entity.userId).toBe(TEST_USER_ID);
			expect(entity.cycleId).toBe(TEST_CYCLE_ID);
			expect(entity.round).toBe(1);
			expect(entity.day).toBe(1);
			expect(entity.completedAt).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("creates set entity with all fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity(TEST_WORKOUT_ID, {
				exerciseName: "Squat",
				category: null,
				setNumber: 1,
				prescribedWeight: 225,
				actualWeight: 225,
				prescribedReps: 5,
				actualReps: 5,
				prescribedRpeMin: null,
				prescribedRpeMax: null,
				rpe: null,
				setDuration: null,
				restDuration: null,
				isMainLift: true,
				isAmrap: false,
			});
			expect(set.workoutId).toBe(TEST_WORKOUT_ID);
			expect(set.exerciseName).toBe("Squat");
			expect(set.prescribedWeight).toBe(225);
			expect(set.isMainLift).toBe(true);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validates workout — returns when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.createEntity(
				TEST_USER_ID,
				TEST_CYCLE_ID,
				1,
				1,
			);
			const result = yield* service.validateWorkout(workout, workout.id);
			expect(result.id).toBe(workout.id);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validates workout — fails when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const error = yield* service
				.validateWorkout(null, TEST_WORKOUT_ID)
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("creates set entity with timing fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity(TEST_WORKOUT_ID, {
				exerciseName: "Squat",
				category: null,
				setNumber: 1,
				prescribedWeight: null,
				actualWeight: null,
				prescribedReps: null,
				actualReps: null,
				prescribedRpeMin: null,
				prescribedRpeMax: null,
				rpe: null,
				isMainLift: true,
				isAmrap: false,
				setDuration: 30,
				restDuration: 120,
			});
			expect(set.setDuration).toBe(30);
			expect(set.restDuration).toBe(120);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("creates set entity with optional fields as null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity(TEST_WORKOUT_ID, {
				exerciseName: "Face Pulls",
				category: null,
				setNumber: 1,
				prescribedWeight: null,
				actualWeight: null,
				prescribedReps: null,
				actualReps: null,
				prescribedRpeMin: null,
				prescribedRpeMax: null,
				rpe: null,
				setDuration: null,
				restDuration: null,
				isMainLift: false,
				isAmrap: false,
			});
			expect(set.prescribedWeight).toBeNull();
			expect(set.actualWeight).toBeNull();
			expect(set.rpe).toBeNull();
			expect(set.setDuration).toBeNull();
			expect(set.restDuration).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it("generateWorkoutPlan returns valid plan for day 1 round 1", () => {
		const lifts = {
			squat: 315,
			bench: 235,
			deadlift: 405,
			ohp: 150,
			unit: "lbs" as const,
		};
		const plan = generateWorkoutPlan(lifts, 1, 1, 1);
		expect(plan.mainLift).toBe("squat");
		expect(plan.day).toBe(1);
		expect(plan.round).toBe(1);
		expect(plan.mainLiftSets.length).toBeGreaterThan(0);
		expect(plan.variation).toBeDefined();
		expect(plan.accessories.length).toBeGreaterThan(0);
	});

	it("generateWorkoutPlan returns valid plan for day 4 (OHP)", () => {
		const lifts = {
			squat: 315,
			bench: 235,
			deadlift: 405,
			ohp: 150,
			unit: "lbs" as const,
		};
		const plan = generateWorkoutPlan(lifts, 1, 1, 4);
		expect(plan.mainLift).toBe("ohp");
		expect(plan.variation).toBeDefined();
	});
});
