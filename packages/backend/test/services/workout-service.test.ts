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
				setNumber: Schema.decodeSync(LogSetInput.fields.setNumber)(1),
				prescribedWeight: 270,
				actualWeight: 275,
				prescribedReps: Schema.decodeSync(LogSetInput.fields.prescribedReps)(5),
				actualReps: Schema.decodeSync(LogSetInput.fields.actualReps)(6),
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
				setDuration: Schema.decodeSync(LogSetInput.fields.setDuration)(45),
				restDuration: Schema.decodeSync(LogSetInput.fields.restDuration)(90),
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

	it.effect(
		"augmentPlanWithWeights enriches plan with matching weights and session data",
		() =>
			Effect.gen(function* () {
				const service = yield* WorkoutService;

				const plan = {
					day: 1 as TrainingDay,
					round: 1 as Round,
					cycle: 1,
					mainLift: "squat" as const,
					mainLiftSets: [],
					variation: {
						category: "squat_variation" as const,
						defaultExercise: "Front Squat",
						sets: [],
					},
					accessories: [
						{
							category: "quad" as const,
							defaultExercise: "Leg Extensions",
							sets: [],
						},
					],
				};

				const exerciseWeightRows = [
					{
						id: crypto.randomUUID(),
						userId: crypto.randomUUID(),
						exerciseName: "Front Squat",
						weight: "135",
						unit: "lbs",
						rpe: null,
						updatedAt: new Date(),
					},
					{
						id: crypto.randomUUID(),
						userId: crypto.randomUUID(),
						exerciseName: "Leg Extensions",
						weight: "90",
						unit: "lbs",
						rpe: null,
						updatedAt: new Date(),
					},
				];

				const lastSessionRows = [
					{
						exerciseName: "Front Squat",
						actualWeight: "130",
						actualReps: 8,
						rpe: "7",
					},
					{
						exerciseName: "Leg Extensions",
						actualWeight: "85",
						actualReps: 12,
						rpe: "6",
					},
				];

				const lifts = {
					squat: 315,
					bench: 225,
					deadlift: 405,
					ohp: 135,
					unit: "lbs" as const,
				};

				const result = yield* service.augmentPlanWithWeights(
					exerciseWeightRows,
					lastSessionRows,
					plan,
					lifts,
				);

				// Variation should be enriched
				expect(result.variation.preferredWeight).toBe(135);
				expect(result.variation.suggestedWeight).toBeTypeOf("number");
				expect(result.variation.lastSession).toEqual({
					weight: 130,
					reps: 8,
					rpe: 7,
				});

				// Accessory should be enriched
				expect(result.accessories[0].preferredWeight).toBe(90);
				expect(result.accessories[0].suggestedWeight).toBeTypeOf("number");
				expect(result.accessories[0].lastSession).toEqual({
					weight: 85,
					reps: 12,
					rpe: 6,
				});

				// Original plan fields preserved
				expect(result.day).toBe(1);
				expect(result.round).toBe(1);
				expect(result.mainLift).toBe("squat");
			}),
	);

	it.effect(
		"augmentPlanWithWeights returns nulls when no weights or session data",
		() =>
			Effect.gen(function* () {
				const service = yield* WorkoutService;

				const plan = {
					day: 2 as TrainingDay,
					round: 2 as Round,
					cycle: 1,
					mainLift: "bench" as const,
					mainLiftSets: [],
					variation: {
						category: "bench_variation" as const,
						defaultExercise: "Incline Bench Press",
						sets: [],
					},
					accessories: [
						{
							category: "tricep" as const,
							defaultExercise: "Overhead Extension (French)",
							sets: [],
						},
					],
				};

				const lifts = {
					squat: 315,
					bench: 225,
					deadlift: 405,
					ohp: 135,
					unit: "lbs" as const,
				};

				const result = yield* service.augmentPlanWithWeights(
					[],
					[],
					plan,
					lifts,
				);

				expect(result.variation.preferredWeight).toBeNull();
				expect(result.variation.lastSession).toBeNull();
				expect(result.accessories[0].preferredWeight).toBeNull();
				expect(result.accessories[0].lastSession).toBeNull();
				// suggestedWeight should still compute from lifts
				expect(result.variation.suggestedWeight).toBeTypeOf("number");
			}),
	);

	it.effect("augmentPlanWithWeights handles partial session data", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;

			const plan = {
				day: 3 as TrainingDay,
				round: 1 as Round,
				cycle: 1,
				mainLift: "deadlift" as const,
				mainLiftSets: [],
				variation: {
					category: "deadlift_variation" as const,
					defaultExercise: "Romanian Deadlift",
					sets: [],
				},
				accessories: [
					{
						category: "vertical_pull" as const,
						defaultExercise: "Pull-Ups",
						sets: [],
					},
					{
						category: "bicep" as const,
						defaultExercise: "Curls (DB/EZ/C)",
						sets: [],
					},
				],
			};

			// Only session data for the variation, not accessories
			const lastSessionRows = [
				{
					exerciseName: "Romanian Deadlift",
					actualWeight: "185",
					actualReps: 10,
					rpe: "6",
				},
			];

			// Only weight for one accessory
			const exerciseWeightRows = [
				{
					id: crypto.randomUUID(),
					userId: crypto.randomUUID(),
					exerciseName: "Pull-Ups",
					weight: "0",
					unit: "lbs",
					rpe: null,
					updatedAt: new Date(),
				},
			];

			const lifts = {
				squat: 315,
				bench: 225,
				deadlift: 405,
				ohp: 135,
				unit: "lbs" as const,
			};

			const result = yield* service.augmentPlanWithWeights(
				exerciseWeightRows,
				lastSessionRows,
				plan,
				lifts,
			);

			// Variation: has session data, no preferred weight
			expect(result.variation.preferredWeight).toBeNull();
			expect(result.variation.lastSession).toEqual({
				weight: 185,
				reps: 10,
				rpe: 6,
			});

			// First accessory: has preferred weight, no session data
			expect(result.accessories[0].preferredWeight).toBe(0);
			expect(result.accessories[0].lastSession).toBeNull();

			// Second accessory: neither
			expect(result.accessories[1].preferredWeight).toBeNull();
			expect(result.accessories[1].lastSession).toBeNull();
		}),
	);
});
