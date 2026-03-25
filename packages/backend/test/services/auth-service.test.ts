import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { AuthService } from "../../src/services/AuthService.js";

describe("AuthService", () => {
	it.effect(
		"createSession generates valid token format (userId.timestamp.signature)",
		() =>
			Effect.gen(function* () {
				const auth = yield* AuthService;
				const token = yield* auth.createSession("user-123");
				const parts = token.split(".");
				expect(parts.length).toBe(3);
				expect(parts[0]).toBe("user-123");
				expect(Number(parts[1])).toBeGreaterThan(0);
				expect(parts[2].length).toBeGreaterThan(0);
			}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("verifySession returns userId for valid token", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-456");
			const userId = yield* auth.verifySession(token);
			expect(userId).toBe("user-456");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("verifySession fails with AuthError for invalid token", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const error = yield* auth.verifySession("invalid").pipe(Effect.flip);
			expect(error._tag).toBe("AuthError");
			expect(error.message).toBe("Invalid session token");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("verifySession fails with AuthError for tampered signature", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-789");
			const parts = token.split(".");
			const tampered = `${parts[0]}.${parts[1]}.tamperedsignature`;
			const error = yield* auth.verifySession(tampered).pipe(Effect.flip);
			expect(error._tag).toBe("AuthError");
			expect(error.message).toBe("Invalid session signature");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("verifySession fails with AuthError for tampered userId", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-original");
			const parts = token.split(".");
			const tampered = `user-hacker.${parts[1]}.${parts[2]}`;
			const error = yield* auth.verifySession(tampered).pipe(Effect.flip);
			expect(error._tag).toBe("AuthError");
			expect(error.message).toBe("Invalid session signature");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("createSessionCookie has correct format", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-123");
			const cookie = yield* auth.createSessionCookie(token);
			expect(cookie).toContain("powercycle_session=");
			expect(cookie).toContain(token);
			expect(cookie).toContain("HttpOnly");
			expect(cookie).toContain("SameSite=Strict");
			expect(cookie).toContain("Path=/");
			expect(cookie).toContain("Max-Age=");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("createLogoutCookie has Max-Age=0", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const cookie = yield* auth.createLogoutCookie();
			expect(cookie).toContain("Max-Age=0");
			expect(cookie).toContain("powercycle_session=;");
			expect(cookie).toContain("HttpOnly");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("test layer works standalone without ConfigService", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("standalone-user");
			const userId = yield* auth.verifySession(token);
			expect(userId).toBe("standalone-user");
		}).pipe(Effect.provide(AuthService.test)),
	);
});
