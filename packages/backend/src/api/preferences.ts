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
					return rows.map((r) => ({
						slotKey: r.slotKey,
						exerciseName: r.exerciseName,
					}));
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
					return {
						slotKey: row.slotKey,
						exerciseName: row.exerciseName,
					};
				}),
			);
	}),
);
