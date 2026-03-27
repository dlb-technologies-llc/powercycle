import { calculateCycleProgression } from "@powercycle/shared";
import { NotFoundError } from "@powercycle/shared/errors/index";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import type { Unit } from "@powercycle/shared/schema/lifts";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import type { NewCycle } from "../db/schema.js";
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
					if (!row) return null;
					const cycle = yield* Cycle.decodeRow(row);
					return Cycle.toResponse(cycle);
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
							unit: ctx.payload.unit as Unit,
						},
						cycleCount + 1,
					);
					const row = yield* insertCycle(db, Cycle.toDbInsert(entity));
					const cycle = yield* Cycle.decodeRow(row);
					return Cycle.toResponse(cycle);
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
					const cycle = yield* Cycle.decodeRow(row);
					const currentLifts = {
						squat: cycle.squat1rm ?? 0,
						bench: cycle.bench1rm ?? 0,
						deadlift: cycle.deadlift1rm ?? 0,
						ohp: cycle.ohp1rm ?? 0,
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
							unit: ctx.payload.unit as Unit,
						},
						cycleCount + 1,
					);
					const row = yield* insertCycle(db, Cycle.toDbInsert(entity));
					const cycle = yield* Cycle.decodeRow(row);
					return Cycle.toResponse(cycle);
				}),
			)
			.handle("update1rm", (ctx) =>
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
					const columnMap: Record<string, keyof NewCycle> = {
						squat: "squat1rm",
						bench: "bench1rm",
						deadlift: "deadlift1rm",
						ohp: "ohp1rm",
					};
					const column = columnMap[ctx.payload.lift];
					const updated = yield* updateCycle(db, row.id, {
						[column]: String(ctx.payload.value),
					} as Partial<NewCycle>);
					const cycle = yield* Cycle.decodeRow(updated);
					return Cycle.toResponse(cycle);
				}),
			);
	}),
);
