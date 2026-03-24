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
import { CycleService } from "./services/CycleService.js";
import { UserService } from "./services/UserService.js";
import { WorkoutService } from "./services/WorkoutService.js";

const PORT = Number(process.env.API_PORT) || 3000;

const ServiceLive = Layer.mergeAll(
	AuthService.test,
	UserService.test,
	CycleService.test,
	WorkoutService.test,
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
