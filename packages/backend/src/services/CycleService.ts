import { NotFoundError } from "@powercycle/shared/errors/index";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import type { MainLift, UserLifts } from "@powercycle/shared/schema/lifts";
import type { Round, TrainingDay } from "@powercycle/shared/schema/program";
import { Effect, Layer, ServiceMap } from "effect";
import type { NewCycle } from "../db/schema.js";

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
		readonly buildLiftUpdate: (
			lift: MainLift,
			value: number,
		) => Partial<NewCycle>;
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
					currentRound: 1,
					currentDay: 1,
					startedAt: new Date(),
					completedAt: null,
				}),
		),

	advancePosition: (cycle) =>
		Effect.sync(() => {
			const nextDay: Record<TrainingDay, TrainingDay | null> = {
				1: 2,
				2: 3,
				3: 4,
				4: null,
			};
			const nextRound: Record<Round, Round | null> = {
				1: 2,
				2: 3,
				3: 4,
				4: null,
			};

			const day = nextDay[cycle.currentDay];
			if (day !== null) {
				return new Cycle({
					...cycle,
					currentDay: day,
				});
			}
			// Day 4 done — advance to next round
			const round = nextRound[cycle.currentRound];
			if (round !== null) {
				return new Cycle({
					...cycle,
					currentRound: round,
					currentDay: 1,
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

	buildLiftUpdate: (lift, value) => {
		const update: Partial<NewCycle> = {};
		update[`${lift}1rm`] = String(value);
		return update;
	},
});

// Pure service — same impl for test
export const CycleTest = CycleLive;
