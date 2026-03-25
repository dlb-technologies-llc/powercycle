import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { Workout, WorkoutSet } from "../db/schema.js";
import {
	findSetsByWorkoutId,
	findWorkoutById,
	findWorkoutHistory,
	insertWorkout,
	insertWorkoutSet,
	updateWorkout,
} from "../lib/queries.js";
import { AuthService } from "../services/AuthService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { WorkoutService } from "../services/WorkoutService.js";
import { PowerCycleApi } from "./index.js";
import { getUserId } from "./middleware.js";

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
		const authService = yield* AuthService;
		const { db } = yield* DatabaseService;

		return handlers
			.handle("history", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
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
				// Placeholder
				Effect.succeed(null),
			)
			.handle("start", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
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
					const _userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
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
							isMainLift: ctx.payload.isMainLift,
							isAmrap: ctx.payload.isAmrap,
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
					});
					return toSetResponse(row);
				}),
			)
			.handle("complete", (ctx) =>
				Effect.gen(function* () {
					const _userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					const workoutRow = yield* findWorkoutById(db, ctx.params.id);
					yield* workoutService.validateWorkout(workoutRow, ctx.params.id);
					const row = yield* updateWorkout(db, ctx.params.id, {
						completedAt: new Date(),
					});
					return toWorkoutResponse(row);
				}),
			);
	}),
);
