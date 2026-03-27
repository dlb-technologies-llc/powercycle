import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { InternalError } from "@powercycle/shared/errors/index";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import { ExerciseWeight } from "@powercycle/shared/schema/entities/exercise-weight";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import { WorkoutSet } from "@powercycle/shared/schema/entities/workout-set";
import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
	findActiveCycle,
	findExerciseWeightsByUserId,
	findInProgressWorkout,
	findLastSessionSets,
	findSetsByWorkoutId,
	findWorkoutById,
	findWorkoutHistory,
	insertWorkout,
	insertWorkoutSet,
	updateCycle,
	updateWorkout,
} from "../lib/queries.js";
import { CycleService } from "../services/CycleService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { WorkoutService } from "../services/WorkoutService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

export const WorkoutsLive = HttpApiBuilder.group(
	PowerCycleApi,
	"workouts",
	Effect.fnUntraced(function* (handlers) {
		const workoutService = yield* WorkoutService;
		const cycleService = yield* CycleService;
		const { db } = yield* DatabaseService;

		return handlers
			.handle("history", (_ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const rows = yield* findWorkoutHistory(db, userId);
					const results = [];
					for (const row of rows) {
						const workout = yield* Workout.decodeRow(row);
						const setRows = yield* findSetsByWorkoutId(db, row.id);
						const sets = [];
						for (const s of setRows) {
							const setEntity = yield* WorkoutSet.decodeRow(s);
							sets.push(WorkoutSet.toResponse(setEntity));
						}
						results.push({
							...Workout.toResponse(workout),
							sets,
						});
					}
					return results;
				}),
			)
			.handle("next", (_ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const row = yield* findActiveCycle(db, userId);
					if (!row) return null;

					const cycle = yield* Cycle.decodeRow(row);

					const round = cycle.currentRound;
					const day = cycle.currentDay;
					if (round < 1 || round > 4 || day < 1 || day > 4) return null;

					const lifts = {
						squat: cycle.squat1rm,
						bench: cycle.bench1rm,
						deadlift: cycle.deadlift1rm,
						ohp: cycle.ohp1rm,
						unit: cycle.unit,
					};

					const plan = generateWorkoutPlan(
						lifts,
						cycle.cycleNumber,
						round,
						day,
					);

					// Fetch preferred weights and build lookup
					const exerciseWeightRows = yield* findExerciseWeightsByUserId(
						db,
						userId,
					);
					const exerciseWeights = yield* Effect.forEach(
						exerciseWeightRows,
						(r) => ExerciseWeight.decodeRow(r),
					);
					const weightMap = new Map(
						exerciseWeights.map((ew) => [ew.exerciseName, ew.weight]),
					);

					// Fetch last session data and build lookup
					const lastSessionRows = yield* findLastSessionSets(db, userId);
					const LastSessionRow = Schema.Struct({
						exerciseName: Schema.String,
						actualWeight: Schema.NullOr(Schema.NumberFromString),
						actualReps: Schema.NullOr(Schema.Number),
						rpe: Schema.NullOr(Schema.NumberFromString),
					});
					const lastSessionMap = new Map<
						string,
						{ weight: number | null; reps: number | null; rpe: number | null }
					>();
					for (const raw of lastSessionRows) {
						if (!lastSessionMap.has(raw.exerciseName)) {
							const decoded = yield* Schema.decodeUnknownEffect(LastSessionRow)(
								raw,
							).pipe(
								Effect.mapError(
									(e) =>
										new InternalError({
											message: `LastSession decode failed: ${e}`,
										}),
								),
							);
							lastSessionMap.set(decoded.exerciseName, {
								weight: decoded.actualWeight,
								reps: decoded.actualReps,
								rpe: decoded.rpe,
							});
						}
					}

					const addPreferredWeight = <T extends { defaultExercise: string }>(
						slot: T,
					) => ({
						...slot,
						preferredWeight: weightMap.get(slot.defaultExercise) ?? null,
						lastSession: lastSessionMap.get(slot.defaultExercise) ?? null,
					});

					return {
						...plan,
						variation: addPreferredWeight(plan.variation),
						accessories: plan.accessories.map(addPreferredWeight),
					};
				}),
			)
			.handle("start", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const existing = yield* findInProgressWorkout(
						db,
						ctx.payload.cycleId,
						ctx.payload.round,
						ctx.payload.day,
					);
					if (existing) {
						const workout = yield* Workout.decodeRow(existing);
						return Workout.toResponse(workout);
					}
					const entity = yield* workoutService.createEntity(
						userId,
						ctx.payload.cycleId,
						ctx.payload.round,
						ctx.payload.day,
					);
					const row = yield* insertWorkout(db, Workout.toDbInsert(entity));
					const workout = yield* Workout.decodeRow(row);
					return Workout.toResponse(workout);
				}),
			)
			.handle("logSet", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					const workoutEntity = workoutRow
						? yield* Workout.decodeRow(workoutRow)
						: null;
					yield* workoutService.validateWorkout(workoutEntity, ctx.params.id);
					const setEntity = yield* workoutService.createSetEntity(
						ctx.params.id,
						ctx.payload,
					);
					const row = yield* insertWorkoutSet(
						db,
						WorkoutSet.toDbInsert(setEntity),
					);
					const inserted = yield* WorkoutSet.decodeRow(row);
					return WorkoutSet.toResponse(inserted);
				}),
			)
			.handle("complete", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					const workoutEntity = workoutRow
						? yield* Workout.decodeRow(workoutRow)
						: null;
					yield* workoutService.validateWorkout(workoutEntity, ctx.params.id);

					// Prevent double-completion
					if (workoutEntity!.completedAt) {
						return Workout.toResponse(workoutEntity!);
					}

					const updatedRow = yield* updateWorkout(db, ctx.params.id, {
						completedAt: new Date(),
					});
					const updatedWorkout = yield* Workout.decodeRow(updatedRow);

					// Advance cycle position only if workout belongs to the active cycle
					const userId = DEFAULT_USER_ID;
					const cycleRow = yield* findActiveCycle(db, userId);
					if (cycleRow && cycleRow.id === workoutEntity!.cycleId) {
						const cycleEntity = yield* Cycle.decodeRow(cycleRow);
						const advanced = yield* cycleService.advancePosition(cycleEntity);
						yield* updateCycle(db, cycleRow.id, {
							currentRound: advanced.currentRound,
							currentDay: advanced.currentDay,
							completedAt: advanced.completedAt,
						});
					}

					return Workout.toResponse(updatedWorkout);
				}),
			)
			.handle("sets", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					const workoutEntity = workoutRow
						? yield* Workout.decodeRow(workoutRow)
						: null;
					yield* workoutService.validateWorkout(workoutEntity, ctx.params.id);
					const setRows = yield* findSetsByWorkoutId(db, ctx.params.id);
					const sets = [];
					for (const s of setRows) {
						const setEntity = yield* WorkoutSet.decodeRow(s);
						sets.push(WorkoutSet.toResponse(setEntity));
					}
					return sets;
				}),
			);
	}),
);
