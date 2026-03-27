import { NotFoundError } from "@powercycle/shared/errors/index";
import { Effect, Layer, ServiceMap } from "effect";

export interface CycleData {
	id: string;
	userId: string;
	cycleNumber: number;
	squat1rm: number | null;
	bench1rm: number | null;
	deadlift1rm: number | null;
	ohp1rm: number | null;
	unit: string;
	currentRound: number;
	currentDay: number;
	startedAt: Date;
	completedAt: Date | null;
}

export class CycleService extends ServiceMap.Service<
	CycleService,
	{
		readonly createEntity: (
			userId: string,
			lifts: {
				squat: number | null;
				bench: number | null;
				deadlift: number | null;
				ohp: number | null;
				unit: string;
			},
			cycleNumber: number,
		) => Effect.Effect<CycleData>;
		readonly advancePosition: (cycle: CycleData) => Effect.Effect<CycleData>;
		readonly isComplete: (cycle: CycleData) => boolean;
		readonly validateActiveCycle: (
			cycle: CycleData | null,
		) => Effect.Effect<CycleData, NotFoundError>;
	}
>()("@powercycle/CycleService") {}

export const CycleLive = Layer.succeed(CycleService)({
	createEntity: (userId, lifts, cycleNumber) =>
		Effect.sync(() => ({
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
		})),

	advancePosition: (cycle) =>
		Effect.sync(() => {
			if (cycle.currentDay < 4) {
				return { ...cycle, currentDay: cycle.currentDay + 1 };
			}
			// Day 4 done — advance to next round
			if (cycle.currentDay === 4 && cycle.currentRound < 4) {
				return {
					...cycle,
					currentRound: cycle.currentRound + 1,
					currentDay: 1,
				};
			}
			// Round 4, day 4 — cycle complete
			return { ...cycle, completedAt: new Date() };
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
