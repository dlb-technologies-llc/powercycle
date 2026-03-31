import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
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
			expect(config.OTEL_COLLECTOR_URL).toBe("http://otel.example.com:4318");
			expect(config.PORT).toBe(4000);
		}).pipe(
			Effect.provide(
				ConfigLive({
					DATABASE_URL: "postgres://test:test@localhost/mydb",
					ENVIRONMENT: "staging",
					OTEL_COLLECTOR_URL: "http://otel.example.com:4318",
					PORT: "4000",
				}),
			),
		),
	);

	it.effect("ConfigLive uses defaults for optional fields", () =>
		Effect.gen(function* () {
			const config = yield* ConfigService;
			expect(config.ENVIRONMENT).toBe("development");
			expect(config.OTEL_COLLECTOR_URL).toBe("http://localhost:4318");
			expect(config.PORT).toBe(3000);
		}).pipe(
			Effect.provide(
				ConfigLive({
					DATABASE_URL: "postgres://localhost/test",
				}),
			),
		),
	);

	it.effect(
		"ConfigLive falls back to development for invalid ENVIRONMENT",
		() =>
			Effect.gen(function* () {
				const config = yield* ConfigService;
				expect(config.ENVIRONMENT).toBe("development");
			}).pipe(
				Effect.provide(
					ConfigLive({
						DATABASE_URL: "postgres://localhost/test",
						ENVIRONMENT: "invalid-env",
					}),
				),
			),
	);

	it.effect("ConfigTest has development defaults", () =>
		Effect.gen(function* () {
			const config = yield* ConfigService;
			expect(config.ENVIRONMENT).toBe("development");
			expect(config.OTEL_COLLECTOR_URL).toBe("http://localhost:4318");
			expect(config.PORT).toBe(3000);
		}).pipe(Effect.provide(ConfigTest)),
	);
});
