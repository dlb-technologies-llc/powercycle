import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { WorkoutService } from "../src/services/WorkoutService.js";

describe("WorkoutService", () => {
	it.effect("starts a workout", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.startWorkout("user-1", "cycle-1", 1, 1);
			expect(workout.userId).toBe("user-1");
			expect(workout.round).toBe(1);
			expect(workout.day).toBe(1);
			expect(workout.completedAt).toBeNull();
		}).pipe(Effect.provide(WorkoutService.test)),
	);

	it.effect("logs a set", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.startWorkout("user-1", "cycle-1", 1, 1);
			const set = yield* service.logSet(workout.id, {
				exerciseName: "Squat",
				setNumber: 1,
				prescribedWeight: 270,
				actualWeight: 270,
				prescribedReps: 5,
				actualReps: 5,
				isMainLift: true,
				isAmrap: true,
			});
			expect(set.exerciseName).toBe("Squat");
			expect(set.actualWeight).toBe(270);
		}).pipe(Effect.provide(WorkoutService.test)),
	);

	it.effect("completes a workout", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.startWorkout("user-1", "cycle-1", 1, 1);
			const completed = yield* service.completeWorkout(workout.id);
			expect(completed.completedAt).not.toBeNull();
		}).pipe(Effect.provide(WorkoutService.test)),
	);

	it.effect("gets a workout with sets", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.startWorkout("user-1", "cycle-1", 1, 1);
			yield* service.logSet(workout.id, {
				exerciseName: "Squat",
				setNumber: 1,
				prescribedWeight: 270,
				actualWeight: 270,
				prescribedReps: 5,
				actualReps: 5,
				isMainLift: true,
				isAmrap: false,
			});
			const found = yield* service.getWorkout(workout.id);
			expect(found).not.toBeNull();
			expect(found?.sets).toHaveLength(1);
		}).pipe(Effect.provide(WorkoutService.test)),
	);
});
