import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

export const PreferencesLive = HttpApiBuilder.group(
	PowerCycleApi,
	"preferences",
	Effect.fnUntraced(function* (handlers) {
		const { db: _db } = yield* DatabaseService;
		const _userId = DEFAULT_USER_ID;

		return handlers
			.handle("getExercises", () =>
				Effect.gen(function* () {
					// TODO: implement with findExercisePreferences
					return [] as Array<{ slotKey: string; exerciseName: string }>;
				}),
			)
			.handle("setExercise", (ctx) =>
				Effect.gen(function* () {
					// TODO: implement with upsertExercisePreference
					return {
						slotKey: ctx.payload.slotKey,
						exerciseName: ctx.payload.exerciseName,
					};
				}),
			);
	}),
);
