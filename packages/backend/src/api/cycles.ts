import { calculateCycleProgression } from "@powercycle/shared";
import { NotFoundError } from "@powercycle/shared/errors/index";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import { Unit } from "@powercycle/shared/schema/lifts";
import { Effect, Schema } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { DEFAULT_USER_ID } from "../lib/constants.js";
import {
	countCyclesByUserId,
	findActiveCycle,
	findLatestCompletedCycleMaxes,
	insertCycle,
	updateCycle,
} from "../lib/queries.js";
import { CycleService } from "../services/CycleService.js";
import { DatabaseService } from "../services/DatabaseService.js";
import { PowerCycleApi } from "./index.js";

const decodeMaxesRow = (row: {
	squat1rm: string | null;
	bench1rm: string | null;
	deadlift1rm: string | null;
	ohp1rm: string | null;
	unit: string;
}) => ({
	squat: row.squat1rm != null ? Number(row.squat1rm) : null,
	bench: row.bench1rm != null ? Number(row.bench1rm) : null,
	deadlift: row.deadlift1rm != null ? Number(row.deadlift1rm) : null,
	ohp: row.ohp1rm != null ? Number(row.ohp1rm) : null,
	unit: Schema.decodeUnknownSync(Unit)(row.unit),
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
							unit: ctx.payload.unit,
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
			.handle("previousMaxes", (_ctx) =>
				Effect.gen(function* () {
					const userId = DEFAULT_USER_ID;
					const row = yield* findLatestCompletedCycleMaxes(db, userId);
					if (!row) return null;
					return decodeMaxesRow(row);
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
					// Fall back to most recently completed cycle's maxes for any null lifts
					const previousRow = yield* findLatestCompletedCycleMaxes(db, userId);
					const previous = previousRow ? decodeMaxesRow(previousRow) : null;
					const cycleCount = yield* countCyclesByUserId(db, userId);
					const entity = yield* cycleService.createEntity(
						userId,
						{
							squat: ctx.payload.squat ?? previous?.squat ?? null,
							bench: ctx.payload.bench ?? previous?.bench ?? null,
							deadlift: ctx.payload.deadlift ?? previous?.deadlift ?? null,
							ohp: ctx.payload.ohp ?? previous?.ohp ?? null,
							unit: ctx.payload.unit,
						},
						cycleCount + 1,
					);
					const row = yield* insertCycle(db, Cycle.toDbInsert(entity));
					const cycle = yield* Cycle.decodeRow(row);
					return Cycle.toResponse(cycle);
				}),
			)
			.handle("end", (_ctx) =>
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
					const updated = yield* updateCycle(db, row.id, {
						completedAt: new Date(),
					});
					const cycle = yield* Cycle.decodeRow(updated);
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
					const liftUpdate = cycleService.buildLiftUpdate(
						ctx.payload.lift,
						ctx.payload.value,
					);
					const updated = yield* updateCycle(db, row.id, liftUpdate);
					const cycle = yield* Cycle.decodeRow(updated);
					return Cycle.toResponse(cycle);
				}),
			);
	}),
);
