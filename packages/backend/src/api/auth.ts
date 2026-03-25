import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { findUserByUsername } from "../lib/queries.js";
import { AuthService } from "../services/AuthService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { UserService } from "../services/UserService.js";
import { PowerCycleApi } from "./index.js";

export const AuthLive = HttpApiBuilder.group(
	PowerCycleApi,
	"auth",
	Effect.fnUntraced(function* (handlers) {
		const authService = yield* AuthService;
		const { db } = yield* DatabaseService;
		const userService = yield* UserService;

		return handlers
			.handle("login", (ctx) =>
				Effect.gen(function* () {
					const user = yield* findUserByUsername(db, ctx.payload.username);
					yield* userService.validateUser(
						user ?? undefined,
						ctx.payload.username,
					);
					// POC: Skip password verification for now
					const token = yield* authService.createSession(user!.id);
					return { success: true as const, token, userId: user!.id };
				}),
			)
			.handle("logout", (_ctx) => Effect.succeed({ success: true as const }));
	}),
);
