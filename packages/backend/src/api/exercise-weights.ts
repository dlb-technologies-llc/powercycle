import { ExerciseWeight } from "@powercycle/shared/schema/entities/exercise-weight";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
	deleteExerciseWeight,
	findExerciseWeightsByUserId,
	upsertExerciseWeight,
} from "../lib/queries.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

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
					const entities = yield* Effect.forEach(rows, (row) =>
						ExerciseWeight.decodeRow(row),
					);
					return entities.map(ExerciseWeight.toResponse);
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
					const entity = yield* ExerciseWeight.decodeRow(row);
					return ExerciseWeight.toResponse(entity);
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
