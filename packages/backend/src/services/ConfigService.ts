import { Layer, Option, Schema, ServiceMap } from "effect";

const Environment = Schema.Literals(["development", "staging", "production"]);

export class ConfigService extends ServiceMap.Service<
	ConfigService,
	{
		readonly DATABASE_URL: string;
		readonly ENVIRONMENT: "development" | "staging" | "production";
		readonly OTEL_COLLECTOR_URL: string;
		readonly PORT: number;
	}
>()("@powercycle/ConfigService") {}

export const ConfigLive = (env: {
	DATABASE_URL: string;
	ENVIRONMENT?: string;
	OTEL_COLLECTOR_URL?: string;
	PORT?: string;
}) =>
	Layer.succeed(ConfigService)({
		DATABASE_URL: env.DATABASE_URL,
		ENVIRONMENT: Schema.decodeUnknownOption(Environment)(env.ENVIRONMENT).pipe(
			Option.getOrElse(() => "development" as const),
		),
		OTEL_COLLECTOR_URL: env.OTEL_COLLECTOR_URL ?? "http://localhost:4318",
		PORT: Number(env.PORT) || 3000,
	});

export const ConfigTest = Layer.succeed(ConfigService)({
	DATABASE_URL: "postgres://test:test@localhost:5432/test",
	ENVIRONMENT: "development",
	OTEL_COLLECTOR_URL: "http://localhost:4318",
	PORT: 3000,
});
