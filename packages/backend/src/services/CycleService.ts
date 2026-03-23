import { Effect, Layer, ServiceMap } from "effect";

export interface CycleData {
	id: string;
	userId: string;
	cycleNumber: number;
	squat1rm: number;
	bench1rm: number;
	deadlift1rm: number;
	ohp1rm: number;
	unit: string;
	currentRound: number;
	currentDay: number;
	startedAt: Date;
	completedAt: Date | null;
}

export class CycleService extends ServiceMap.Service<
	CycleService,
	{
		readonly createCycle: (
			userId: string,
			lifts: {
				squat: number;
				bench: number;
				deadlift: number;
				ohp: number;
				unit: string;
			},
		) => Effect.Effect<CycleData>;
		readonly getCurrentCycle: (
			userId: string,
		) => Effect.Effect<CycleData | null>;
		readonly advancePosition: (cycleId: string) => Effect.Effect<CycleData>;
	}
>()("CycleService") {
	static test = Layer.sync(this, () => {
		const store: CycleData[] = [];

		return {
			createCycle: (userId, lifts) =>
				Effect.sync(() => {
					const cycle: CycleData = {
						id: crypto.randomUUID(),
						userId,
						cycleNumber: store.filter((c) => c.userId === userId).length + 1,
						squat1rm: lifts.squat,
						bench1rm: lifts.bench,
						deadlift1rm: lifts.deadlift,
						ohp1rm: lifts.ohp,
						unit: lifts.unit,
						currentRound: 1,
						currentDay: 1,
						startedAt: new Date(),
						completedAt: null,
					};
					store.push(cycle);
					return cycle;
				}),

			getCurrentCycle: (userId) =>
				Effect.sync(
					() =>
						store.find((c) => c.userId === userId && c.completedAt === null) ??
						null,
				),

			advancePosition: (cycleId) =>
				Effect.sync(() => {
					const cycle = store.find((c) => c.id === cycleId);
					if (!cycle) throw new Error("Cycle not found");

					if (cycle.currentDay < 5) {
						cycle.currentDay++;
					} else {
						// Day 5 done — advance to next round
						if (cycle.currentRound < 4) {
							cycle.currentRound++;
							cycle.currentDay = 1;
						} else {
							// Round 4, day 5 — cycle complete
							cycle.completedAt = new Date();
						}
					}
					return { ...cycle };
				}),
		};
	});
}
