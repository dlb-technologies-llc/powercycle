import { ExercisePreference } from "@powercycle/shared/schema/entities/exercise-preference";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import {
	findExercisePreferences,
	upsertExercisePreference,
} from "../lib/queries.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

export const PreferencesLive = HttpApiBuilder.group(
	PowerCycleApi,
	"preferences",
	Effect.fnUntraced(function* (handlers) {
		const { db } = yield* DatabaseService;
		const userId = DEFAULT_USER_ID;

		return handlers
			.handle("getExercises", () =>
				Effect.gen(function* () {
					const rows = yield* findExercisePreferences(db, userId);
					const entities = yield* Effect.forEach(rows, (r) =>
						ExercisePreference.decodeRow(r),
					);
					return entities.map(ExercisePreference.toResponse);
				}),
			)
			.handle("setExercise", (ctx) =>
				Effect.gen(function* () {
					const row = yield* upsertExercisePreference(
						db,
						userId,
						ctx.payload.slotKey,
						ctx.payload.exerciseName,
					);
					const entity = yield* ExercisePreference.decodeRow(row);
					return ExercisePreference.toResponse(entity);
				}),
			);
	}),
);
