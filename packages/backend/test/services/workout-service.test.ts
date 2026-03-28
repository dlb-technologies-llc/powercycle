import { expect, layer } from "@effect/vitest";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import { LogSetInput } from "@powercycle/shared/schema/entities/workout-set";
import { Round, TrainingDay } from "@powercycle/shared/schema/program";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

const sampleLogSetInput = () => {
	const arb = Schema.toArbitrary(LogSetInput);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

const sampleWorkout = () => {
	const arb = Schema.toArbitrary(Workout);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

layer(WorkoutLive)("WorkoutService", (it) => {
	it.effect("createEntity generates UUID and correct fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const userId = crypto.randomUUID();
			const cycleId = crypto.randomUUID();
			const workout = yield* service.createEntity(userId, cycleId, 2, 3);
			expect(workout.id).toBeDefined();
			expect(typeof workout.id).toBe("string");
			expect(workout.userId).toBe(userId);
			expect(workout.cycleId).toBe(cycleId);
			expect(workout.round).toBe(2);
			expect(workout.day).toBe(3);
			expect(workout.startedAt).toBeInstanceOf(Date);
			expect(workout.completedAt).toBeNull();
		}),
	);

	it.effect("createEntity generates unique IDs", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const userId = crypto.randomUUID();
			const cycleId = crypto.randomUUID();
			const w1 = yield* service.createEntity(userId, cycleId, 1, 1);
			const w2 = yield* service.createEntity(userId, cycleId, 1, 2);
			expect(w1.id).not.toBe(w2.id);
		}),
	);

	it.effect("createSetEntity maps all fields correctly from LogSetInput", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
				exerciseName: "Squat",
				category: "Lower",
				setNumber: 1 as never,
				prescribedWeight: 270,
				actualWeight: 275,
				prescribedReps: 5 as never,
				actualReps: 6 as never,
				prescribedRpeMin: 7,
				prescribedRpeMax: 8,
				rpe: 8,
				isMainLift: true,
				isAmrap: true,
			};
			const set = yield* service.createSetEntity(workoutId, input);
			expect(set.id).toBeDefined();
			expect(set.workoutId).toBe(workoutId);
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
		}),
	);

	it.effect("createSetEntity defaults optional fields to null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
				category: null,
				prescribedWeight: null,
				actualWeight: null,
				prescribedReps: null,
				actualReps: null,
				prescribedRpeMin: null,
				prescribedRpeMax: null,
				rpe: null,
				setDuration: null,
				restDuration: null,
			};
			const set = yield* service.createSetEntity(workoutId, input);
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
		}),
	);

	it.effect("createSetEntity maps timing fields correctly", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
				setDuration: 45 as never,
				restDuration: 90 as never,
			};
			const set = yield* service.createSetEntity(workoutId, input);
			expect(set.setDuration).toBe(45);
			expect(set.restDuration).toBe(90);
		}),
	);

	it.effect("validateWorkout returns workout when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workout = new Workout(sampleWorkout());
			const result = yield* service.validateWorkout(workout, workout.id);
			expect(result).toBe(workout);
		}),
	);

	it.effect("validateWorkout fails with NotFoundError when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const error = yield* service
				.validateWorkout(null, workoutId)
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
			expect(error.message).toBe(`Workout not found: ${workoutId}`);
			expect(error.resource).toBe("workout");
		}),
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
			}),
	);
});
