import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import type { User } from "../../src/db/schema.js";
import { UserLive, UserService } from "../../src/services/UserService.js";

describe("UserService", () => {
	it.effect("createEntity generates UUID and timestamp", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const entity = yield* service.createEntity({
				username: "testuser",
				passwordHash: "hashed123",
			});
			expect(entity.id).toBeDefined();
			expect(entity.id.length).toBeGreaterThan(0);
			expect(entity.username).toBe("testuser");
			expect(entity.passwordHash).toBe("hashed123");
			expect(entity.createdAt).toBeInstanceOf(Date);
		}).pipe(Effect.provide(UserLive)),
	);

	it.effect("createEntity generates unique IDs", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const e1 = yield* service.createEntity({
				username: "user1",
				passwordHash: "hash1",
			});
			const e2 = yield* service.createEntity({
				username: "user2",
				passwordHash: "hash2",
			});
			expect(e1.id).not.toBe(e2.id);
		}).pipe(Effect.provide(UserLive)),
	);

	it.effect("validateUser returns user when found", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const mockUser = {
				id: "user-1",
				username: "testuser",
				passwordHash: "hash",
				createdAt: new Date(),
			} as User;
			const result = yield* service.validateUser(mockUser, "user-1");
			expect(result.id).toBe("user-1");
		}).pipe(Effect.provide(UserLive)),
	);

	it.effect("validateUser fails with NotFoundError when undefined", () =>
		Effect.gen(function* () {
			const service = yield* UserService;
			const result = yield* service
				.validateUser(undefined, "user-1")
				.pipe(Effect.flip);
			expect(result._tag).toBe("NotFoundError");
			expect(result.resource).toBe("user");
		}).pipe(Effect.provide(UserLive)),
	);
});
