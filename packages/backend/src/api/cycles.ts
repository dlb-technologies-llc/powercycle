import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { CycleService } from "../services/CycleService.js";
import { PowerCycleApi } from "./index.js";

export const CyclesLive = HttpApiBuilder.group(
	PowerCycleApi,
	"cycles",
	Effect.fnUntraced(function* (handlers) {
		const cycleService = yield* CycleService;
		return handlers
			.handle("current", () => cycleService.getCurrentCycle("TODO-user-id"))
			.handle("create", (ctx) =>
				cycleService.createCycle("TODO-user-id", {
					squat: ctx.payload.squat,
					bench: ctx.payload.bench,
					deadlift: ctx.payload.deadlift,
					ohp: ctx.payload.ohp,
					unit: ctx.payload.unit,
				}),
			);
	}),
);
