import { NotFoundError } from "@powercycle/shared/errors/index";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import type { UserLifts } from "@powercycle/shared/schema/lifts";
import { Effect, Layer, ServiceMap } from "effect";

export class CycleService extends ServiceMap.Service<
	CycleService,
	{
		readonly createEntity: (
			userId: string,
			lifts: UserLifts,
			cycleNumber: number,
		) => Effect.Effect<Cycle>;
		readonly advancePosition: (cycle: Cycle) => Effect.Effect<Cycle>;
		readonly isComplete: (cycle: Cycle) => boolean;
		readonly validateActiveCycle: (
			cycle: Cycle | null,
		) => Effect.Effect<Cycle, NotFoundError>;
	}
>()("@powercycle/CycleService") {}

export const CycleLive = Layer.succeed(CycleService)({
	createEntity: (userId, lifts, cycleNumber) =>
		Effect.sync(
			() =>
				new Cycle({
					id: crypto.randomUUID(),
					userId,
					cycleNumber,
					squat1rm: lifts.squat,
					bench1rm: lifts.bench,
					deadlift1rm: lifts.deadlift,
					ohp1rm: lifts.ohp,
					unit: lifts.unit,
					currentRound: 1 as 1,
					currentDay: 1 as 1,
					startedAt: new Date(),
					completedAt: null,
				}),
		),

	advancePosition: (cycle) =>
		Effect.sync(() => {
			if (cycle.currentDay < 4) {
				return new Cycle({
					...cycle,
					currentDay: (cycle.currentDay + 1) as typeof cycle.currentDay,
				});
			}
			// Day 4 done — advance to next round
			if (cycle.currentDay === 4 && cycle.currentRound < 4) {
				return new Cycle({
					...cycle,
					currentRound: (cycle.currentRound + 1) as typeof cycle.currentRound,
					currentDay: 1 as 1,
				});
			}
			// Round 4, day 4 — cycle complete
			return new Cycle({ ...cycle, completedAt: new Date() });
		}),

	isComplete: (cycle) => cycle.completedAt !== null,

	validateActiveCycle: (cycle) =>
		cycle
			? Effect.succeed(cycle)
			: Effect.fail(
					new NotFoundError({
						message: "No active cycle found",
						resource: "cycle",
					}),
				),
});

// Pure service — same impl for test
export const CycleTest = CycleLive;
