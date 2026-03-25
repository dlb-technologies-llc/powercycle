import { describe, expect, it } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import {
	ConfigLive,
	ConfigService,
	ConfigTest,
} from "../../src/services/ConfigService.js";

describe("ConfigService", () => {
	it.effect("ConfigLive provides correct values", () =>
		Effect.gen(function* () {
			const config = yield* ConfigService;
			expect(config.DATABASE_URL).toBe("postgres://test:test@localhost/mydb");
			expect(config.ENVIRONMENT).toBe("staging");
			expect(config.PORT).toBe(4000);
			expect(Redacted.value(config.AUTH_SECRET)).toBe("my-secret");
		}).pipe(
			Effect.provide(
				ConfigLive({
					DATABASE_URL: "postgres://test:test@localhost/mydb",
					AUTH_SECRET: "my-secret",
					ENVIRONMENT: "staging",
					PORT: "4000",
				}),
			),
		),
	);

	it.effect("ConfigLive uses defaults for optional fields", () =>
		Effect.gen(function* () {
			const config = yield* ConfigService;
			expect(config.ENVIRONMENT).toBe("development");
			expect(config.PORT).toBe(3000);
		}).pipe(
			Effect.provide(
				ConfigLive({
					DATABASE_URL: "postgres://localhost/test",
					AUTH_SECRET: "secret",
				}),
			),
		),
	);

	it.effect("ConfigTest has development defaults", () =>
		Effect.gen(function* () {
			const config = yield* ConfigService;
			expect(config.ENVIRONMENT).toBe("development");
			expect(config.PORT).toBe(3000);
			expect(Redacted.value(config.AUTH_SECRET)).toBe(
				"test-secret-key-for-testing-only",
			);
		}).pipe(Effect.provide(ConfigTest)),
	);

	it("Redacted hides secret in toString", () => {
		const secret = Redacted.make("super-secret");
		expect(String(secret)).not.toContain("super-secret");
	});
});
