import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { HttpMiddleware, HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { CyclesLive } from "./api/cycles.js";
import { ExerciseWeightsLive } from "./api/exercise-weights.js";
import { HealthLive } from "./api/health.js";
import { PowerCycleApi } from "./api/index.js";
import { PreferencesLive } from "./api/preferences.js";
import { WorkoutsLive } from "./api/workouts.js";
import { TelemetryDev, TelemetryLive } from "./lib/telemetry.js";
import { ConfigLive } from "./services/ConfigService.js";
import { CycleLive } from "./services/CycleService.js";
import { DatabaseService } from "./services/DatabaseService.js";
import { WorkoutLive } from "./services/WorkoutService.js";

const PORT = Number(process.env.API_PORT) || 3000;
const ENVIRONMENT = process.env.NODE_ENV;

const allowedOrigins =
	process.env.NODE_ENV === "production"
		? ["https://powercycle.app"]
		: process.env.NODE_ENV === "staging"
			? ["https://staging.powercycle.app"]
			: ["http://localhost:4321"];
const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgres://powercycle:powercycle@localhost:5432/powercycle";

const configLayer = ConfigLive({
	DATABASE_URL,
	ENVIRONMENT: process.env.NODE_ENV,
	OTEL_COLLECTOR_URL: process.env.OTEL_COLLECTOR_URL,
});

const ServiceLive = Layer.mergeAll(
	CycleLive,
	WorkoutLive,
	DatabaseService.layer(DATABASE_URL),
	configLayer,
);

const HandlerLive = Layer.mergeAll(
	Layer.provide(CyclesLive, ServiceLive),
	Layer.provide(WorkoutsLive, ServiceLive),
	Layer.provide(PreferencesLive, ServiceLive),
	Layer.provide(ExerciseWeightsLive, ServiceLive),
	Layer.provide(HealthLive, HttpRouter.disableLogger),
);

const ApiLive = HttpApiBuilder.layer(PowerCycleApi).pipe(
	Layer.provide(HandlerLive),
);

// Format span names as "METHOD /path"
const SpanNameLive = Layer.succeed(HttpMiddleware.SpanNameGenerator)(
	(request) => `${request.method} ${request.url.split("?")[0]}`,
);

// Suppress tracer on health check
const TracerDisabledLive = Layer.succeed(HttpMiddleware.TracerDisabledWhen)(
	(req) => req.url === "/health",
);

// Select telemetry layer based on environment
const telemetryLayer =
	ENVIRONMENT === "production"
		? Layer.provide(TelemetryLive, configLayer)
		: TelemetryDev;

const ServerLive = HttpRouter.serve(ApiLive, {
	middleware: HttpMiddleware.cors({
		allowedOrigins,
		allowedMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
		credentials: true,
	}),
}).pipe(
	Layer.provide(SpanNameLive),
	Layer.provide(TracerDisabledLive),
	Layer.provide(NodeHttpServer.layer(createServer, { port: PORT })),
	Layer.provide(telemetryLayer),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
