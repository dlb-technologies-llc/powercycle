import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import { WorkoutSet } from "@powercycle/shared/schema/entities/workout-set";
import { Effect } from "effect";
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

					const round = row.currentRound;
					const day = row.currentDay;
					if (round < 1 || round > 4 || day < 1 || day > 4) return null;

					const lifts = {
						squat: row.squat1rm != null ? Number(row.squat1rm) : null,
						bench: row.bench1rm != null ? Number(row.bench1rm) : null,
						deadlift: row.deadlift1rm != null ? Number(row.deadlift1rm) : null,
						ohp: row.ohp1rm != null ? Number(row.ohp1rm) : null,
						unit: row.unit as "lbs" | "kg",
					};

					const plan = generateWorkoutPlan(
						lifts,
						row.cycleNumber,
						round as 1 | 2 | 3 | 4,
						day as 1 | 2 | 3 | 4,
					);

					// Fetch preferred weights and build lookup
					const exerciseWeightRows = yield* findExerciseWeightsByUserId(
						db,
						userId,
					);
					const weightMap = new Map(
						exerciseWeightRows.map((ew) => [
							ew.exerciseName,
							Number(ew.weight),
						]),
					);

					// Fetch last session data and build lookup
					const lastSessionRows = yield* findLastSessionSets(db, userId);
					const lastSessionMap = new Map<
						string,
						{ weight: number | null; reps: number | null; rpe: number | null }
					>();
					for (const row of lastSessionRows) {
						if (!lastSessionMap.has(row.exerciseName)) {
							lastSessionMap.set(row.exerciseName, {
								weight: row.actualWeight ? Number(row.actualWeight) : null,
								reps: row.actualReps,
								rpe: row.rpe ? Number(row.rpe) : null,
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
						{
							exerciseName: ctx.payload.exerciseName,
							setNumber: ctx.payload.setNumber,
							prescribedWeight: ctx.payload.prescribedWeight ?? undefined,
							actualWeight: ctx.payload.actualWeight ?? undefined,
							prescribedReps: ctx.payload.prescribedReps ?? undefined,
							actualReps: ctx.payload.actualReps ?? undefined,
							rpe: ctx.payload.rpe ?? undefined,
							prescribedRpeMin: ctx.payload.prescribedRpeMin ?? undefined,
							prescribedRpeMax: ctx.payload.prescribedRpeMax ?? undefined,
							isMainLift: ctx.payload.isMainLift,
							isAmrap: ctx.payload.isAmrap,
							category: ctx.payload.category ?? undefined,
							setDuration: ctx.payload.setDuration ?? undefined,
							restDuration: ctx.payload.restDuration ?? undefined,
						},
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
