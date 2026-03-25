import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { hashPassword, verifyPassword } from "../../src/lib/password.js";

describe("password", () => {
	it.effect("hashPassword returns a string hash", () =>
		Effect.gen(function* () {
			const hash = yield* hashPassword("test-password-123");
			expect(typeof hash).toBe("string");
			expect(hash.length).toBeGreaterThan(0);
			expect(hash).not.toBe("test-password-123");
		}),
	);

	it.effect("verifyPassword returns true for correct password", () =>
		Effect.gen(function* () {
			const hash = yield* hashPassword("correct-password");
			const result = yield* verifyPassword("correct-password", hash);
			expect(result).toBe(true);
		}),
	);

	it.effect("verifyPassword returns false for wrong password", () =>
		Effect.gen(function* () {
			const hash = yield* hashPassword("correct-password");
			const result = yield* verifyPassword("wrong-password", hash);
			expect(result).toBe(false);
		}),
	);
});
