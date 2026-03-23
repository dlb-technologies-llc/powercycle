import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { UserService } from "../src/services/UserService.js";

describe("UserService", () => {
	it.effect("creates a user", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const user = yield* service.createUser("admin", "password123");
			expect(user.username).toBe("admin");
			expect(user.id).toBeDefined();
		}).pipe(Effect.provide(UserService.test)),
	);

	it.effect("verifies a user", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const user = yield* service.verifyUser("admin", "password123");
			expect(user.username).toBe("admin");
			expect(user.id).toBeDefined();
		}).pipe(Effect.provide(UserService.test)),
	);
});
