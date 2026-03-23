import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { PowerCycleApi } from "./index.js";

export const HealthLive = HttpApiBuilder.group(
	PowerCycleApi,
	"health",
	(handlers) =>
		handlers.handle("check", () => Effect.succeed({ status: "ok" })),
);
