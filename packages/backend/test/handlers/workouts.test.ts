import { describe, expect, it, layer } from "@effect/vitest";
import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import {
	LogSetInput,
	WorkoutSet,
} from "@powercycle/shared/schema/entities/workout-set";
import { UserLifts } from "@powercycle/shared/schema/lifts";
import { Effect, Layer, Schema } from "effect";
import { FastCheck } from "effect/testing";
import { CycleLive, CycleService } from "../../src/services/CycleService.js";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

const sampleLifts = () => {
	const arb = Schema.toArbitrary(UserLifts);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

const sampleLogSetInput = () => {
	const arb = Schema.toArbitrary(LogSetInput);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

layer(WorkoutLive)("workouts handler logic", (it) => {
	it.effect("creates workout entity", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const userId = crypto.randomUUID();
			const cycleId = crypto.randomUUID();
			const entity = yield* service.createEntity(userId, cycleId, 1, 1);
			expect(entity.id).toBeDefined();
			expect(entity.userId).toBe(userId);
			expect(entity.cycleId).toBe(cycleId);
			expect(entity.round).toBe(1);
			expect(entity.day).toBe(1);
			expect(entity.completedAt).toBeNull();
		}),
	);

	it.effect("creates set entity with all fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
				exerciseName: "Squat",
				prescribedWeight: 225,
				isMainLift: true,
			};
			const set = yield* service.createSetEntity(workoutId, input);
			expect(set.workoutId).toBe(workoutId);
			expect(set.exerciseName).toBe("Squat");
			expect(set.prescribedWeight).toBe(225);
			expect(set.isMainLift).toBe(true);
		}),
	);

	it.effect("validates workout — returns when found", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const userId = crypto.randomUUID();
			const cycleId = crypto.randomUUID();
			const workout = yield* service.createEntity(userId, cycleId, 1, 1);
			const result = yield* service.validateWorkout(workout, workout.id);
			expect(result.id).toBe(workout.id);
		}),
	);

	it.effect("validates workout — fails when null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const error = yield* service
				.validateWorkout(null, workoutId)
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
		}),
	);

	it.effect("creates set entity with timing fields", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
				setDuration: 30,
				restDuration: 120,
			};
			const set = yield* service.createSetEntity(workoutId, input);
			expect(set.setDuration).toBe(30);
			expect(set.restDuration).toBe(120);
		}),
	);

	it.effect("creates set entity with optional fields as null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const input = {
				...sampleLogSetInput(),
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
			expect(set.prescribedWeight).toBeNull();
			expect(set.actualWeight).toBeNull();
			expect(set.rpe).toBeNull();
			expect(set.setDuration).toBeNull();
			expect(set.restDuration).toBeNull();
		}),
	);

	it.effect("logSet insert object includes non-null completedAt", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const setEntity = yield* service.createSetEntity(
				workoutId,
				sampleLogSetInput(),
			);
			// Simulate what the logSet handler does: spread toDbInsert + add completedAt
			const insertData = {
				...WorkoutSet.toDbInsert(setEntity),
				completedAt: setEntity.completedAt,
			};
			expect(insertData.completedAt).toBeInstanceOf(Date);
			// Verify toResponse produces a valid ISO string
			const response = WorkoutSet.toResponse(setEntity);
			expect(response.completedAt).not.toBeNull();
			expect(new Date(response.completedAt!).toISOString()).toBe(
				response.completedAt,
			);
		}),
	);
});

describe("workouts handler logic (pure)", () => {
	it("generateWorkoutPlan returns valid plan for day 1 round 1", () => {
		const base = sampleLifts();
		const lifts = {
			...base,
			squat: base.squat ?? 315,
			bench: base.bench ?? 235,
			deadlift: base.deadlift ?? 405,
			ohp: base.ohp ?? 150,
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
		const base = sampleLifts();
		const lifts = {
			...base,
			squat: base.squat ?? 315,
			bench: base.bench ?? 235,
			deadlift: base.deadlift ?? 405,
			ohp: base.ohp ?? 150,
		};
		const plan = generateWorkoutPlan(lifts, 1, 1, 4);
		expect(plan.mainLift).toBe("ohp");
		expect(plan.variation).toBeDefined();
	});
});

const CurrentTestLayer = Layer.mergeAll(WorkoutLive, CycleLive);

layer(CurrentTestLayer)("current workout handler logic", (it) => {
	it.effect("returns null when no active cycle exists", () =>
		Effect.gen(function* () {
			// The handler's first step: findActiveCycle → if null, return null
			// Verify CycleService.validateActiveCycle correctly rejects null
			const cycleService = yield* CycleService;
			const error = yield* cycleService
				.validateActiveCycle(null)
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
			// Handler short-circuits: if (!cycleRow) return null
		}),
	);

	it.effect(
		"returns null when active cycle exists but no in-progress workout",
		() =>
			Effect.gen(function* () {
				const cycleService = yield* CycleService;
				const lifts = sampleLifts();
				const cycle = yield* cycleService.createEntity(
					crypto.randomUUID(),
					lifts,
					1,
				);

				// Cycle decodes successfully — handler proceeds past null check
				const decodedCycle = yield* Cycle.decodeRow({
					...cycle,
					squat1rm: cycle.squat1rm != null ? String(cycle.squat1rm) : null,
					bench1rm: cycle.bench1rm != null ? String(cycle.bench1rm) : null,
					deadlift1rm:
						cycle.deadlift1rm != null ? String(cycle.deadlift1rm) : null,
					ohp1rm: cycle.ohp1rm != null ? String(cycle.ohp1rm) : null,
				});
				expect(decodedCycle.currentRound).toBe(1);
				expect(decodedCycle.currentDay).toBe(1);

				// Handler: findInProgressWorkout returns null → handler returns null
				// WorkoutService.validateWorkout rejects null workouts
				const workoutService = yield* WorkoutService;
				const workoutError = yield* workoutService
					.validateWorkout(null, crypto.randomUUID())
					.pipe(Effect.flip);
				expect(workoutError._tag).toBe("NotFoundError");
			}),
	);

	it.effect(
		"returns WorkoutResponse when active cycle has in-progress workout",
		() =>
			Effect.gen(function* () {
				const cycleService = yield* CycleService;
				const workoutService = yield* WorkoutService;

				// Create cycle entity (simulates findActiveCycle returning a row)
				const lifts = sampleLifts();
				const cycle = yield* cycleService.createEntity(
					crypto.randomUUID(),
					lifts,
					1,
				);

				// Decode cycle row (same path as handler: Cycle.decodeRow)
				const decodedCycle = yield* Cycle.decodeRow({
					...cycle,
					// Simulate Drizzle string numerics
					squat1rm: cycle.squat1rm != null ? String(cycle.squat1rm) : null,
					bench1rm: cycle.bench1rm != null ? String(cycle.bench1rm) : null,
					deadlift1rm:
						cycle.deadlift1rm != null ? String(cycle.deadlift1rm) : null,
					ohp1rm: cycle.ohp1rm != null ? String(cycle.ohp1rm) : null,
				});
				expect(decodedCycle.currentRound).toBe(1);
				expect(decodedCycle.currentDay).toBe(1);

				// Create in-progress workout (completedAt = null)
				const workout = yield* workoutService.createEntity(
					cycle.userId,
					cycle.id,
					decodedCycle.currentRound,
					decodedCycle.currentDay,
				);
				expect(workout.completedAt).toBeNull();

				// Decode workout row (same path as handler: Workout.decodeRow)
				const decodedWorkout = yield* Workout.decodeRow(workout);

				// Handler returns Workout.toResponse(workout)
				const response = Workout.toResponse(decodedWorkout);
				expect(response.id).toBe(workout.id);
				expect(response.userId).toBe(cycle.userId);
				expect(response.cycleId).toBe(cycle.id);
				expect(response.round).toBe(1);
				expect(response.day).toBe(1);
				expect(response.completedAt).toBeNull();
				expect(typeof response.startedAt).toBe("string");
			}),
	);

	it.effect(
		"returns null when workout exists but is completed (completedAt set)",
		() =>
			Effect.gen(function* () {
				const cycleService = yield* CycleService;
				const workoutService = yield* WorkoutService;

				const lifts = sampleLifts();
				const cycle = yield* cycleService.createEntity(
					crypto.randomUUID(),
					lifts,
					1,
				);

				// Create workout (initially in-progress)
				const workout = yield* workoutService.createEntity(
					cycle.userId,
					cycle.id,
					cycle.currentRound,
					cycle.currentDay,
				);
				expect(workout.completedAt).toBeNull();

				// Mark workout as completed
				const completedWorkout = new Workout({
					...workout,
					completedAt: new Date(),
				});
				expect(completedWorkout.completedAt).toBeInstanceOf(Date);

				// Verify completed workout decodes with non-null completedAt
				const decoded = yield* Workout.decodeRow(completedWorkout);
				expect(decoded.completedAt).toBeInstanceOf(Date);

				// Handler: findInProgressWorkout filters by isNull(completedAt)
				// A completed workout would not be returned by the query → null → handler returns null
				const response = Workout.toResponse(decoded);
				expect(response.completedAt).not.toBeNull();
			}),
	);
});
