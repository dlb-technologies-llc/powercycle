import { createServer } from "node:http";
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthLive } from "./api/auth.js";
import { CyclesLive } from "./api/cycles.js";
import { HealthLive } from "./api/health.js";
import { PowerCycleApi } from "./api/index.js";
import { WorkoutsLive } from "./api/workouts.js";
import { AuthService } from "./services/AuthService.js";
import { ConfigLive } from "./services/ConfigService.js";
import { CycleLive } from "./services/CycleService.js";
import { DatabaseService } from "./services/DatabaseService.js";
import { UserLive } from "./services/UserService.js";
import { WorkoutLive } from "./services/WorkoutService.js";

const PORT = Number(process.env.API_PORT) || 3000;
const DATABASE_URL =
	process.env.DATABASE_URL ??
	"postgres://powercycle:powercycle@localhost:5432/powercycle";

const configLayer = ConfigLive({
	DATABASE_URL,
	AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret-change-me",
});

const ServiceLive = Layer.mergeAll(
	Layer.provide(AuthService.live, configLayer),
	UserLive,
	CycleLive,
	WorkoutLive,
	DatabaseService.layer(DATABASE_URL),
	configLayer,
);

const HandlerLive = Layer.mergeAll(
	Layer.provide(AuthLive, ServiceLive),
	Layer.provide(CyclesLive, ServiceLive),
	Layer.provide(WorkoutsLive, ServiceLive),
	HealthLive,
);

const ApiLive = HttpApiBuilder.layer(PowerCycleApi).pipe(
	Layer.provide(HandlerLive),
);

const ServerLive = HttpRouter.serve(ApiLive).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port: PORT })),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
