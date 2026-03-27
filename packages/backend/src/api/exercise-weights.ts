import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { ExerciseWeight } from "../db/schema.js";
import {
	deleteExerciseWeight,
	findExerciseWeightsByUserId,
	upsertExerciseWeight,
} from "../lib/queries.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

const toExerciseWeightResponse = (row: ExerciseWeight) => ({
	id: row.id,
	userId: row.userId,
	exerciseName: row.exerciseName,
	weight: Number(row.weight),
	unit: row.unit,
	rpe: row.rpe ? Number(row.rpe) : null,
	updatedAt:
		row.updatedAt instanceof Date
			? row.updatedAt.toISOString()
			: String(row.updatedAt),
});

export const ExerciseWeightsLive = HttpApiBuilder.group(
	PowerCycleApi,
	"exerciseWeights",
	Effect.fnUntraced(function* (handlers) {
		const { db } = yield* DatabaseService;

		return handlers
			.handle("list", (_ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const rows = yield* findExerciseWeightsByUserId(db, userId);
					return rows.map(toExerciseWeightResponse);
				}),
			)
			.handle("upsert", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const row = yield* upsertExerciseWeight(db, {
						userId,
						exerciseName: ctx.payload.exerciseName,
						weight: String(ctx.payload.weight),
						unit: ctx.payload.unit,
						rpe: ctx.payload.rpe != null ? String(ctx.payload.rpe) : null,
					});
					return toExerciseWeightResponse(row);
				}),
			)
			.handle("remove", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const deleted = yield* deleteExerciseWeight(
						db,
						userId,
						ctx.params.exerciseName,
					);
					return { deleted };
				}),
			);
	}),
);
