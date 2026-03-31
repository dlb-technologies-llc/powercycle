import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { Otlp } from "effect/unstable/observability";
import { ConfigService } from "../services/ConfigService.js";

export const TelemetryLive = Layer.unwrap(
	Effect.gen(function* () {
		const config = yield* ConfigService;

		return Otlp.layerJson({
			baseUrl: config.OTEL_COLLECTOR_URL,
			resource: {
				serviceName: "powercycle-backend",
				serviceVersion: "0.0.1",
				attributes: {
					"deployment.environment": config.ENVIRONMENT,
				},
			},
		}).pipe(Layer.provide(FetchHttpClient.layer));
	}),
);

export const TelemetryDev = Layer.empty;

export const TelemetryTest = Layer.empty;
