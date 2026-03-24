import { calculateCycleProgression } from "@powercycle/shared";
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
			)
			.handle("progress", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					const cycle = yield* cycleService.getCurrentCycle(userId);
					if (!cycle) {
						return yield* Effect.die(new Error("No active cycle"));
					}
					const currentLifts = {
						squat: cycle.squat1rm,
						bench: cycle.bench1rm,
						deadlift: cycle.deadlift1rm,
						ohp: cycle.ohp1rm,
					};
					return calculateCycleProgression(ctx.payload, currentLifts);
				}),
			)
			.handle("next", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					const currentCycle = yield* cycleService.getCurrentCycle(userId);
					if (currentCycle) {
						currentCycle.completedAt = new Date();
					}
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
