import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { AuthService } from "../../src/services/AuthService.js";
import { UserLive, UserService } from "../../src/services/UserService.js";

describe("auth handler logic", () => {
	it.effect("creates session token for valid user", () =>
		Effect.gen(function* () {
			const authService = yield* AuthService;
			const token = yield* authService.createSession("user-123");
			expect(token).toContain("user-123");
			const userId = yield* authService.verifySession(token);
			expect(userId).toBe("user-123");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("validates user existence", () =>
		Effect.gen(function* () {
			const userService = yield* UserService;
			const mockUser = {
				id: "u1",
				username: "test",
				passwordHash: "h",
				createdAt: new Date(),
			};
			const result = yield* userService.validateUser(mockUser, "u1");
			expect(result.id).toBe("u1");
		}).pipe(Effect.provide(UserLive)),
	);

	it.effect("rejects missing user", () =>
		Effect.gen(function* () {
			const userService = yield* UserService;
			const error = yield* userService
				.validateUser(undefined, "u1")
				.pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
		}).pipe(Effect.provide(UserLive)),
	);
});
