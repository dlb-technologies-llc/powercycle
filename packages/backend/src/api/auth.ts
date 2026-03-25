import { AuthError, ValidationError } from "@powercycle/shared/errors/index";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { findUserByUsername, insertUser } from "../lib/queries.js";
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
					const valid = yield* verifyPassword(
						ctx.payload.password,
						user!.passwordHash,
					);
					if (!valid) {
						return yield* Effect.fail(
							new AuthError({ message: "Invalid password" }),
						);
					}
					const token = yield* authService.createSession(user!.id);
					return { success: true as const, token, userId: user!.id };
				}),
			)
			.handle("register", (ctx) =>
				Effect.gen(function* () {
					if (ctx.payload.username.length < 3) {
						return yield* Effect.fail(
							new ValidationError({
								message: "Username must be at least 3 characters",
								field: "username",
							}),
						);
					}
					if (ctx.payload.password.length < 8) {
						return yield* Effect.fail(
							new ValidationError({
								message: "Password must be at least 8 characters",
								field: "password",
							}),
						);
					}
					const hash = yield* hashPassword(ctx.payload.password);
					const entity = yield* userService.createEntity({
						username: ctx.payload.username,
						passwordHash: hash,
					});
					yield* insertUser(db, {
						username: entity.username,
						passwordHash: entity.passwordHash,
					});
					return { success: true as const, userId: entity.id };
				}),
			)
			.handle("logout", (_ctx) => Effect.succeed({ success: true as const }));
	}),
);
