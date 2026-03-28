import { describe, expect, it, layer } from "@effect/vitest";
import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { WorkoutSet } from "@powercycle/shared/schema/entities/workout-set";
import { Effect } from "effect";
import {
	WorkoutLive,
	WorkoutService,
} from "../../src/services/WorkoutService.js";

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
			const set = yield* service.createSetEntity(workoutId, {
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
			const set = yield* service.createSetEntity(workoutId, {
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
		}),
	);

	it.effect("creates set entity with optional fields as null", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const set = yield* service.createSetEntity(workoutId, {
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
		}),
	);

	it.effect("logSet insert object includes non-null completedAt", () =>
		Effect.gen(function* () {
			const service = yield* WorkoutService;
			const workoutId = crypto.randomUUID();
			const setEntity = yield* service.createSetEntity(workoutId, {
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
