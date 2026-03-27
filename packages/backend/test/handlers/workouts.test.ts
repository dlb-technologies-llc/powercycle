import { describe, expect, it } from "@effect/vitest";
import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { Effect } from "effect";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

describe("workouts handler logic", () => {
	it.effect("creates workout entity", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const entity = yield* service.createEntity("user-1", "cycle-1", 1, 1);
			expect(entity.id).toBeDefined();
			expect(entity.userId).toBe("user-1");
			expect(entity.cycleId).toBe("cycle-1");
			expect(entity.round).toBe(1);
			expect(entity.day).toBe(1);
			expect(entity.completedAt).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("creates set entity with all fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity("workout-1", {
				exerciseName: "Squat",
				setNumber: 1,
				prescribedWeight: 225,
				actualWeight: 225,
				prescribedReps: 5,
				actualReps: 5,
				isMainLift: true,
				isAmrap: false,
			});
			expect(set.workoutId).toBe("workout-1");
			expect(set.exerciseName).toBe("Squat");
			expect(set.prescribedWeight).toBe(225);
			expect(set.isMainLift).toBe(true);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validates workout — returns when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.createEntity("user-1", "cycle-1", 1, 1);
			const result = yield* service.validateWorkout(workout, workout.id);
			expect(result.id).toBe(workout.id);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validates workout — fails when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const error = yield* service
				.validateWorkout(null, "missing-id")
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("creates set entity with timing fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity("workout-1", {
				exerciseName: "Squat",
				setNumber: 1,
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
			const set = yield* service.createSetEntity("workout-1", {
				exerciseName: "Face Pulls",
				setNumber: 1,
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
