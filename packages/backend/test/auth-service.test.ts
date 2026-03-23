import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { AuthService } from "../src/services/AuthService.js";

describe("AuthService", () => {
	it.effect("creates and verifies a session", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-123");
			const userId = yield* auth.verifySession(token);
			expect(userId).toBe("user-123");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("rejects invalid tokens", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const exit = yield* Effect.exit(auth.verifySession("invalid.token.data"));
			expect(exit._tag).toBe("Failure");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("creates session cookie", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const token = yield* auth.createSession("user-123");
			const cookie = yield* auth.createSessionCookie(token);
			expect(cookie).toContain("powercycle_session=");
			expect(cookie).toContain("HttpOnly");
			expect(cookie).toContain("SameSite=Strict");
		}).pipe(Effect.provide(AuthService.test)),
	);

	it.effect("creates logout cookie that clears session", () =>
		Effect.gen(function* () {
			const auth = yield* AuthService;
			const cookie = yield* auth.createLogoutCookie();
			expect(cookie).toContain("Max-Age=0");
		}).pipe(Effect.provide(AuthService.test)),
	);
});
