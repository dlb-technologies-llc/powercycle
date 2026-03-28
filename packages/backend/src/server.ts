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
import { ConfigLive } from "./services/ConfigService.js";
import { CycleLive } from "./services/CycleService.js";
import { DatabaseService } from "./services/DatabaseService.js";
import { WorkoutLive } from "./services/WorkoutService.js";

const PORT = Number(process.env.API_PORT) || 3000;

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
	HealthLive,
);

const ApiLive = HttpApiBuilder.layer(PowerCycleApi).pipe(
	Layer.provide(HandlerLive),
);

const ServerLive = HttpRouter.serve(ApiLive, {
	middleware: HttpMiddleware.cors({
		allowedOrigins,
		allowedMethods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
		credentials: true,
	}),
}).pipe(Layer.provide(NodeHttpServer.layer(createServer, { port: PORT })));

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
