import { describe, expect, it } from "@effect/vitest";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import { Round, TrainingDay } from "@powercycle/shared/schema/program";
import { Effect, Schema } from "effect";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

const TEST_USER_ID = "00000000-0000-4000-a000-000000000001";
const TEST_CYCLE_ID = "00000000-0000-4000-a000-000000000002";
const TEST_WORKOUT_ID = "00000000-0000-4000-a000-000000000003";

describe("WorkoutService", () => {
	it.effect("createEntity generates UUID and correct fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = yield* service.createEntity(
				TEST_USER_ID,
				TEST_CYCLE_ID,
				2,
				3,
			);
			expect(workout.id).toBeDefined();
			expect(typeof workout.id).toBe("string");
			expect(workout.userId).toBe(TEST_USER_ID);
			expect(workout.cycleId).toBe(TEST_CYCLE_ID);
			expect(workout.round).toBe(2);
			expect(workout.day).toBe(3);
			expect(workout.startedAt).toBeInstanceOf(Date);
			expect(workout.completedAt).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createEntity generates unique IDs", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const w1 = yield* service.createEntity(TEST_USER_ID, TEST_CYCLE_ID, 1, 1);
			const w2 = yield* service.createEntity(TEST_USER_ID, TEST_CYCLE_ID, 1, 2);
			expect(w1.id).not.toBe(w2.id);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createSetEntity maps all fields correctly from LogSetInput", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const set = yield* service.createSetEntity(TEST_WORKOUT_ID, {
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
				setDuration: null,
				restDuration: null,
				isMainLift: true,
				isAmrap: true,
			});
			expect(set.id).toBeDefined();
			expect(set.workoutId).toBe(TEST_WORKOUT_ID);
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
			const set = yield* service.createSetEntity(TEST_WORKOUT_ID, {
				exerciseName: "Bench Press",
				category: null,
				setNumber: 2,
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
			expect(set.category).toBeNull();
			expect(set.prescribedWeight).toBeNull();
			expect(set.actualWeight).toBeNull();
			expect(set.prescribedReps).toBeNull();
			expect(set.actualReps).toBeNull();
			expect(set.prescribedRpeMin).toBeNull();
			expect(set.prescribedRpeMax).toBeNull();
			expect(set.rpe).toBeNull();
			expect(set.setDuration).toBeNull();
			expect(set.restDuration).toBeNull();
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("createSetEntity maps timing fields correctly", () =>
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
				setDuration: 45,
				restDuration: 90,
			});
			expect(set.setDuration).toBe(45);
			expect(set.restDuration).toBe(90);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validateWorkout returns workout when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = new Workout({
				id: TEST_WORKOUT_ID,
				userId: TEST_USER_ID,
				cycleId: TEST_CYCLE_ID,
				round: 1 as never,
				day: 1 as never,
				startedAt: new Date(),
				completedAt: null,
			});
			const result = yield* service.validateWorkout(workout, TEST_WORKOUT_ID);
			expect(result).toBe(workout);
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect("validateWorkout fails with NotFoundError when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const error = yield* service
				.validateWorkout(null, TEST_WORKOUT_ID)
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
			expect(error.message).toBe(`Workout not found: ${TEST_WORKOUT_ID}`);
			expect(error.resource).toBe("workout");
		}).pipe(Effect.provide(WorkoutLive)),
	);

	it.effect.prop(
		"createEntity always generates unique IDs",
		{ round: Schema.toArbitrary(Round), day: Schema.toArbitrary(TrainingDay) },
		({ round, day }) =>
			Effect.gen(function* () {
				const service = yield* WorkoutService;
				const w1 = yield* service.createEntity(
					crypto.randomUUID(),
					crypto.randomUUID(),
					round,
					day,
				);
				const w2 = yield* service.createEntity(
					crypto.randomUUID(),
					crypto.randomUUID(),
					round,
					day,
				);
				expect(w1.id).not.toBe(w2.id);
			}).pipe(Effect.provide(WorkoutLive)),
	);
});
