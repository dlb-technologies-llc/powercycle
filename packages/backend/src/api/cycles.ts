import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthService } from "../services/AuthService.js";
import { CycleService } from "../services/CycleService.js";
import { PowerCycleApi } from "./index.js";
import { getUserId } from "./middleware.js";

export const CyclesLive = HttpApiBuilder.group(
	PowerCycleApi,
	"cycles",
	Effect.fnUntraced(function* (handlers) {
		const cycleService = yield* CycleService;
		const authService = yield* AuthService;
		return handlers
			.handle("current", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					return yield* cycleService.getCurrentCycle(userId);
				}),
			)
			.handle("create", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					return yield* cycleService.createCycle(userId, {
						squat: ctx.payload.squat,
						bench: ctx.payload.bench,
						deadlift: ctx.payload.deadlift,
						ohp: ctx.payload.ohp,
						unit: ctx.payload.unit,
					});
				}),
			);
	}),
);
