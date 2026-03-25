import { calculateCycleProgression } from "@powercycle/shared";
import { NotFoundError } from "@powercycle/shared/errors/index";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { Cycle } from "../db/schema.js";
import {
	countCyclesByUserId,
	findActiveCycle,
	insertCycle,
	updateCycle,
} from "../lib/queries.js";
import { CycleService } from "../services/CycleService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";

const toCycleResponse = (row: Cycle) => ({
	id: row.id,
	userId: row.userId,
	cycleNumber: row.cycleNumber,
	squat1rm: Number(row.squat1rm),
	bench1rm: Number(row.bench1rm),
	deadlift1rm: Number(row.deadlift1rm),
	ohp1rm: Number(row.ohp1rm),
	unit: row.unit,
	currentRound: row.currentRound,
	currentDay: row.currentDay,
	startedAt:
		row.startedAt instanceof Date
			? row.startedAt.toISOString()
			: String(row.startedAt),
	completedAt:
		row.completedAt instanceof Date
			? row.completedAt.toISOString()
			: row.completedAt
				? String(row.completedAt)
				: null,
});

export const CyclesLive = HttpApiBuilder.group(
	PowerCycleApi,
	"cycles",
	Effect.fnUntraced(function* (handlers) {
		const cycleService = yield* CycleService;
		const { db } = yield* DatabaseService;

		return handlers
			.handle("current", (_ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const row = yield* findActiveCycle(db, userId);
					return row ? toCycleResponse(row) : null;
				}),
			)
			.handle("create", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const cycleCount = yield* countCyclesByUserId(db, userId);
					const entity = yield* cycleService.createEntity(
						userId,
						{
							squat: ctx.payload.squat,
							bench: ctx.payload.bench,
							deadlift: ctx.payload.deadlift,
							ohp: ctx.payload.ohp,
							unit: ctx.payload.unit,
						},
						cycleCount + 1,
					);
					const row = yield* insertCycle(db, {
						userId: entity.userId,
						cycleNumber: entity.cycleNumber,
						squat1rm: String(entity.squat1rm),
						bench1rm: String(entity.bench1rm),
						deadlift1rm: String(entity.deadlift1rm),
						ohp1rm: String(entity.ohp1rm),
						unit: entity.unit,
						currentRound: entity.currentRound,
						currentDay: entity.currentDay,
					});
					return toCycleResponse(row);
				}),
			)
			.handle("progress", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const row = yield* findActiveCycle(db, userId);
					if (!row) {
						return yield* Effect.fail(
							new NotFoundError({
								message: "No active cycle found",
								resource: "cycle",
							}),
						);
					}
					const currentLifts = {
						squat: Number(row.squat1rm),
						bench: Number(row.bench1rm),
						deadlift: Number(row.deadlift1rm),
						ohp: Number(row.ohp1rm),
					};
					return calculateCycleProgression(ctx.payload, currentLifts);
				}),
			)
			.handle("next", (ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const currentRow = yield* findActiveCycle(db, userId);
					if (currentRow) {
						yield* updateCycle(db, currentRow.id, {
							completedAt: new Date(),
						});
					}
					const cycleCount = yield* countCyclesByUserId(db, userId);
					const entity = yield* cycleService.createEntity(
						userId,
						{
							squat: ctx.payload.squat,
							bench: ctx.payload.bench,
							deadlift: ctx.payload.deadlift,
							ohp: ctx.payload.ohp,
							unit: ctx.payload.unit,
						},
						cycleCount + 1,
					);
					const row = yield* insertCycle(db, {
						userId: entity.userId,
						cycleNumber: entity.cycleNumber,
						squat1rm: String(entity.squat1rm),
						bench1rm: String(entity.bench1rm),
						deadlift1rm: String(entity.deadlift1rm),
						ohp1rm: String(entity.ohp1rm),
						unit: entity.unit,
						currentRound: entity.currentRound,
						currentDay: entity.currentDay,
					});
					return toCycleResponse(row);
				}),
			);
	}),
);
