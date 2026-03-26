import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import {
	type CycleData,
	CycleLive,
	CycleService,
} from "../../src/services/CycleService.js";

const testLifts = {
	squat: 315,
	bench: 235,
	deadlift: 405,
	ohp: 150,
	unit: "lbs",
};

describe("CycleService", () => {
	it.effect("createEntity generates correct defaults", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity("user-1", testLifts, 1);

			expect(cycle.id).toBeDefined();
			expect(cycle.userId).toBe("user-1");
			expect(cycle.cycleNumber).toBe(1);
			expect(cycle.squat1rm).toBe(315);
			expect(cycle.bench1rm).toBe(235);
			expect(cycle.deadlift1rm).toBe(405);
			expect(cycle.ohp1rm).toBe(150);
			expect(cycle.unit).toBe("lbs");
			expect(cycle.currentRound).toBe(1);
			expect(cycle.currentDay).toBe(1);
			expect(cycle.startedAt).toBeInstanceOf(Date);
			expect(cycle.completedAt).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("advancePosition: day 1 to day 2", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity("user-1", testLifts, 1);
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentDay).toBe(2);
			expect(advanced.currentRound).toBe(1);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("advancePosition: day 3 to day 4", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle: CycleData = {
				...(yield* service.createEntity("user-1", testLifts, 1)),
				currentDay: 3,
			};
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentDay).toBe(4);
			expect(advanced.currentRound).toBe(1);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("advancePosition: day 4 advances to next round day 1", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle: CycleData = {
				...(yield* service.createEntity("user-1", testLifts, 1)),
				currentDay: 4,
				currentRound: 2,
			};
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentRound).toBe(3);
			expect(advanced.currentDay).toBe(1);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("advancePosition: round 4 day 4 sets completedAt", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle: CycleData = {
				...(yield* service.createEntity("user-1", testLifts, 1)),
				currentRound: 4,
				currentDay: 4,
			};
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.completedAt).toBeInstanceOf(Date);
			expect(advanced.currentRound).toBe(4);
			expect(advanced.currentDay).toBe(4);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("advancePosition returns a new object (immutability)", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const original = yield* service.createEntity("user-1", testLifts, 1);
			const advanced = yield* service.advancePosition(original);

			expect(advanced).not.toBe(original);
			expect(original.currentDay).toBe(1);
			expect(advanced.currentDay).toBe(2);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("isComplete: false for active cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity("user-1", testLifts, 1);
			expect(service.isComplete(cycle)).toBe(false);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("isComplete: true for completed cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle: CycleData = {
				...(yield* service.createEntity("user-1", testLifts, 1)),
				completedAt: new Date(),
			};
			expect(service.isComplete(cycle)).toBe(true);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("validateActiveCycle returns cycle when not null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity("user-1", testLifts, 1);
			const validated = yield* service.validateActiveCycle(cycle);

			expect(validated).toEqual(cycle);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("validateActiveCycle fails with NotFoundError when null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const result = yield* service.validateActiveCycle(null).pipe(
				Effect.matchEffect({
					onFailure: (error) =>
						Effect.sync(() => {
							expect(error._tag).toBe("NotFoundError");
							expect(error.message).toBe("No active cycle found");
							expect(error.resource).toBe("cycle");
							return "caught";
						}),
					onSuccess: () => Effect.die("Expected failure"),
				}),
			);
			expect(result).toBe("caught");
		}).pipe(Effect.provide(CycleLive)),
	);
});
