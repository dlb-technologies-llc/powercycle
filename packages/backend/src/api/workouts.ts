import { generateWorkoutPlan } from "@powercycle/shared/engine/workout";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { Workout, WorkoutSet } from "../db/schema.js";
import {
	findActiveCycle,
	findInProgressWorkout,
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

const toWorkoutResponse = (row: Workout) => ({
	id: row.id,
	userId: row.userId,
	cycleId: row.cycleId,
	round: row.round,
	day: row.day,
	startedAt:
		row.startedAt instanceof Date
			? row.startedAt.toISOString()
			: String(row.startedAt),
	completedAt:
		row.completedAt instanceof Date
			? row.completedAt.toISOString()
			: row.completedAt
				? String(row.completedAt)
				: null,
});

const toSetResponse = (row: WorkoutSet) => ({
	id: row.id,
	workoutId: row.workoutId,
	exerciseName: row.exerciseName,
	category: row.category,
	setNumber: row.setNumber,
	prescribedWeight: row.prescribedWeight ? Number(row.prescribedWeight) : null,
	actualWeight: row.actualWeight ? Number(row.actualWeight) : null,
	prescribedReps: row.prescribedReps,
	actualReps: row.actualReps,
	prescribedRpeMin: row.prescribedRpeMin ? Number(row.prescribedRpeMin) : null,
	prescribedRpeMax: row.prescribedRpeMax ? Number(row.prescribedRpeMax) : null,
	rpe: row.rpe ? Number(row.rpe) : null,
	isMainLift: row.isMainLift,
	isAmrap: row.isAmrap,
	setDuration: row.setDuration ?? null,
	restDuration: row.restDuration ?? null,
	completedAt:
		row.completedAt instanceof Date
			? row.completedAt.toISOString()
			: row.completedAt
				? String(row.completedAt)
				: null,
});

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
						const sets = yield* findSetsByWorkoutId(db, row.id);
						results.push({
							...toWorkoutResponse(row),
							sets: sets.map(toSetResponse),
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
						squat: Number(row.squat1rm),
						bench: Number(row.bench1rm),
						deadlift: Number(row.deadlift1rm),
						ohp: Number(row.ohp1rm),
						unit: row.unit as "lbs" | "kg",
					};

					return generateWorkoutPlan(
						lifts,
						row.cycleNumber,
						round as 1 | 2 | 3 | 4,
						day as 1 | 2 | 3 | 4,
					);
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
						return toWorkoutResponse(existing);
					}
					const entity = yield* workoutService.createEntity(
						userId,
						ctx.payload.cycleId,
						ctx.payload.round,
						ctx.payload.day,
					);
					const row = yield* insertWorkout(db, {
						userId: entity.userId,
						cycleId: entity.cycleId,
						round: entity.round,
						day: entity.day,
					});
					return toWorkoutResponse(row);
				}),
			)
			.handle("logSet", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					yield* workoutService.validateWorkout(workoutRow, ctx.params.id);
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
					const row = yield* insertWorkoutSet(db, {
						workoutId: setEntity.workoutId,
						exerciseName: setEntity.exerciseName,
						category: setEntity.category,
						setNumber: setEntity.setNumber,
						prescribedWeight: setEntity.prescribedWeight
							? String(setEntity.prescribedWeight)
							: null,
						actualWeight: setEntity.actualWeight
							? String(setEntity.actualWeight)
							: null,
						prescribedReps: setEntity.prescribedReps,
						actualReps: setEntity.actualReps,
						prescribedRpeMin: setEntity.prescribedRpeMin
							? String(setEntity.prescribedRpeMin)
							: null,
						prescribedRpeMax: setEntity.prescribedRpeMax
							? String(setEntity.prescribedRpeMax)
							: null,
						rpe: setEntity.rpe ? String(setEntity.rpe) : null,
						isMainLift: setEntity.isMainLift,
						isAmrap: setEntity.isAmrap,
						setDuration: setEntity.setDuration,
						restDuration: setEntity.restDuration,
					});
					return toSetResponse(row);
				}),
			)
			.handle("complete", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					yield* workoutService.validateWorkout(workoutRow, ctx.params.id);

					// Prevent double-completion
					if (workoutRow!.completedAt) {
						return toWorkoutResponse(workoutRow!);
					}

					const row = yield* updateWorkout(db, ctx.params.id, {
						completedAt: new Date(),
					});

					// Advance cycle position only if workout belongs to the active cycle
					const userId = DEFAULT_USER_ID;
					const cycle = yield* findActiveCycle(db, userId);
					if (cycle && cycle.id === workoutRow!.cycleId) {
						const cycleData = {
							id: cycle.id,
							userId: cycle.userId,
							cycleNumber: cycle.cycleNumber,
							squat1rm: Number(cycle.squat1rm),
							bench1rm: Number(cycle.bench1rm),
							deadlift1rm: Number(cycle.deadlift1rm),
							ohp1rm: Number(cycle.ohp1rm),
							unit: cycle.unit,
							currentRound: cycle.currentRound,
							currentDay: cycle.currentDay,
							startedAt:
								cycle.startedAt instanceof Date
									? cycle.startedAt
									: new Date(String(cycle.startedAt)),
							completedAt: cycle.completedAt,
						};
						const advanced = yield* cycleService.advancePosition(cycleData);
						yield* updateCycle(db, cycle.id, {
							currentRound: advanced.currentRound,
							currentDay: advanced.currentDay,
							completedAt: advanced.completedAt,
						});
					}

					return toWorkoutResponse(row);
				}),
			)
			.handle("sets", (ctx) =>
				Effect.gen(function* () {
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					yield* workoutService.validateWorkout(workoutRow, ctx.params.id);
					const sets = yield* findSetsByWorkoutId(db, ctx.params.id);
					return sets.map(toSetResponse);
				}),
			);
	}),
);
