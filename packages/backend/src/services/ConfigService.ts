import { Layer, ServiceMap } from "effect";

export class ConfigService extends ServiceMap.Service<
	ConfigService,
	{
		readonly DATABASE_URL: string;
		readonly ENVIRONMENT: "development" | "staging" | "production";
		readonly PORT: number;
	}
>()("@powercycle/ConfigService") {}

export const ConfigLive = (env: {
	DATABASE_URL: string;
	ENVIRONMENT?: string;
	PORT?: string;
}) =>
	Layer.succeed(ConfigService)({
		DATABASE_URL: env.DATABASE_URL,
		ENVIRONMENT:
			(env.ENVIRONMENT as "development" | "staging" | "production") ??
			"development",
		PORT: Number(env.PORT) || 3000,
	});

export const ConfigTest = Layer.succeed(ConfigService)({
	DATABASE_URL: "postgres://test:test@localhost:5432/test",
	ENVIRONMENT: "development" as const,
	PORT: 3000,
});
