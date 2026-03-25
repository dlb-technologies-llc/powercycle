import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { WorkoutData } from "../../src/services/WorkoutService.js";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

describe("WorkoutService", () => {
	it.effect("createEntity generates UUID and correct fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.createEntity("user-1", "cycle-1", 2, 3);
			expect(workout.id).toBeDefined();
			expect(typeof workout.id).toBe("string");
			expect(workout.userId).toBe("user-1");
			expect(workout.cycleId).toBe("cycle-1");
			expect(workout.round).toBe(2);
			expect(workout.day).toBe(3);
			expect(workout.startedAt).toBeInstanceOf(Date);
			expect(workout.completedAt).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createEntity generates unique IDs", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const w1 = yield* service.createEntity("user-1", "cycle-1", 1, 1);
			const w2 = yield* service.createEntity("user-1", "cycle-1", 1, 2);
			expect(w1.id).not.toBe(w2.id);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createSetEntity maps all fields correctly from LogSetInput", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity("workout-1", {
				exerciseName: "Squat",
				category: "Lower",
				setNumber: 1,
				prescribedWeight: 270,
				actualWeight: 275,
				prescribedReps: 5,
				actualReps: 6,
				prescribedRpeMin: 7,
				prescribedRpeMax: 8,
				rpe: 8,
				isMainLift: true,
				isAmrap: true,
			});
			expect(set.id).toBeDefined();
			expect(set.workoutId).toBe("workout-1");
			expect(set.exerciseName).toBe("Squat");
			expect(set.category).toBe("Lower");
			expect(set.setNumber).toBe(1);
			expect(set.prescribedWeight).toBe(270);
			expect(set.actualWeight).toBe(275);
			expect(set.prescribedReps).toBe(5);
			expect(set.actualReps).toBe(6);
			expect(set.prescribedRpeMin).toBe(7);
			expect(set.prescribedRpeMax).toBe(8);
			expect(set.rpe).toBe(8);
			expect(set.isMainLift).toBe(true);
			expect(set.isAmrap).toBe(true);
			expect(set.completedAt).toBeInstanceOf(Date);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createSetEntity defaults optional fields to null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity("workout-1", {
				exerciseName: "Bench Press",
				setNumber: 2,
				isMainLift: false,
				isAmrap: false,
			});
			expect(set.category).toBeNull();
			expect(set.prescribedWeight).toBeNull();
			expect(set.actualWeight).toBeNull();
			expect(set.prescribedReps).toBeNull();
			expect(set.actualReps).toBeNull();
			expect(set.prescribedRpeMin).toBeNull();
			expect(set.prescribedRpeMax).toBeNull();
			expect(set.rpe).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validateWorkout returns workout when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout: WorkoutData = {
				id: "w-1",
				userId: "user-1",
				cycleId: "cycle-1",
				round: 1,
				day: 1,
				startedAt: new Date(),
				completedAt: null,
			};
			const result = yield* service.validateWorkout(workout, "w-1");
			expect(result).toBe(workout);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validateWorkout fails with NotFoundError when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const error = yield* service
				.validateWorkout(null, "missing-id")
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
			expect(error.message).toBe("Workout not found: missing-id");
			expect(error.resource).toBe("workout");
		}).pipe(Effect.provide(WorkoutLive)),
	);
});
