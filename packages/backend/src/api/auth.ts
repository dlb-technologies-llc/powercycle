import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";
import { PowerCycleApi } from "./index.js";

export const AuthLive = HttpApiBuilder.group(
	PowerCycleApi,
	"auth",
	Effect.fnUntraced(function* (handlers) {
		const userService = yield* UserService;
		const authService = yield* AuthService;
		return handlers
			.handle("login", (ctx) =>
				Effect.gen(function* () {
					const user = yield* userService.verifyUser(
						ctx.payload.username,
						ctx.payload.password,
					);
					const token = yield* authService.createSession(user.id);
					return { success: true, token, userId: user.id };
				}),
			)
			.handle("logout", () =>
				Effect.gen(function* () {
					yield* authService.createLogoutCookie();
					return { success: true };
				}),
			);
	}),
);
