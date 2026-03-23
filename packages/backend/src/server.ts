import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import {
	NodeFileSystem,
	NodeHttpPlatform,
	NodeHttpServer,
	NodePath,
	NodeRuntime,
} from "@effect/platform-node";
import { Layer } from "effect";
import { HttpRouter, HttpStaticServer } from "effect/unstable/http";
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

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === "production";

const DIST_DIR = resolve(
	new URL(".", import.meta.url).pathname,
	"../../../frontend/dist",
);

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

const StaticFilesLive =
	isProduction && existsSync(DIST_DIR)
		? HttpStaticServer.layer({
				root: DIST_DIR,
				spa: true,
				cacheControl: "public, max-age=3600",
			}).pipe(
				Layer.provide(
					Layer.mergeAll(
						NodePath.layer,
						NodeFileSystem.layer,
						NodeHttpPlatform.layer,
					),
				),
			)
		: Layer.empty;

const AppLive = Layer.mergeAll(ApiLive, StaticFilesLive);

const ServerLive = HttpRouter.serve(AppLive).pipe(
	Layer.provide(NodeHttpServer.layer(createServer, { port: PORT })),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
