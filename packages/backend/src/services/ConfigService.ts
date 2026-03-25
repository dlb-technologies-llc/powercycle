import { Layer, Redacted, ServiceMap } from "effect";

export class ConfigService extends ServiceMap.Service<
	ConfigService,
	{
		readonly DATABASE_URL: string;
		readonly AUTH_SECRET: Redacted.Redacted<string>;
		readonly ENVIRONMENT: "development" | "staging" | "production";
		readonly PORT: number;
	}
>()("@powercycle/ConfigService") {}

export const ConfigLive = (env: {
	DATABASE_URL: string;
	AUTH_SECRET: string;
	ENVIRONMENT?: string;
	PORT?: string;
}) =>
	Layer.succeed(ConfigService)({
		DATABASE_URL: env.DATABASE_URL,
		AUTH_SECRET: Redacted.make(env.AUTH_SECRET),
		ENVIRONMENT:
			(env.ENVIRONMENT as "development" | "staging" | "production") ??
			"development",
		PORT: Number(env.PORT) || 3000,
	});

export const ConfigTest = Layer.succeed(ConfigService)({
	DATABASE_URL: "postgres://test:test@localhost:5432/test",
	AUTH_SECRET: Redacted.make("test-secret-key-for-testing-only"),
	ENVIRONMENT: "development" as const,
	PORT: 3000,
});
