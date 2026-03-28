import { expect, layer } from "@effect/vitest";
import { Cycle } from "@powercycle/shared/schema/entities/cycle";
import { UserLifts } from "@powercycle/shared/schema/lifts";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import { CycleLive, CycleService } from "../../src/services/CycleService.js";

const sampleLifts = () => {
	const arb = Schema.toArbitrary(UserLifts);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

const sampleLiftsWithNulls = () => ({
	...sampleLifts(),
	bench: null,
	ohp: null,
});

const sampleLiftsAllNull = () => ({
	...sampleLifts(),
	squat: null,
	bench: null,
	deadlift: null,
	ohp: null,
});

layer(CycleLive)("CycleService", (it) => {
	it.effect("createEntity generates correct defaults", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLifts();
			const userId = crypto.randomUUID();
			const cycle = yield* service.createEntity(userId, lifts, 1);

			expect(cycle.id).toBeDefined();
			expect(cycle.userId).toBe(userId);
			expect(cycle.cycleNumber).toBe(1);
			expect(cycle.squat1rm).toBe(lifts.squat);
			expect(cycle.bench1rm).toBe(lifts.bench);
			expect(cycle.deadlift1rm).toBe(lifts.deadlift);
			expect(cycle.ohp1rm).toBe(lifts.ohp);
			expect(cycle.unit).toBe(lifts.unit);
			expect(cycle.currentRound).toBe(1);
			expect(cycle.currentDay).toBe(1);
			expect(cycle.startedAt).toBeInstanceOf(Date);
			expect(cycle.completedAt).toBeNull();
		}),
	);

	it.effect("createEntity with null 1RMs stores null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLiftsAllNull();
			const cycle = yield* service.createEntity(crypto.randomUUID(), lifts, 1);

			expect(cycle.squat1rm).toBeNull();
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.deadlift1rm).toBeNull();
			expect(cycle.ohp1rm).toBeNull();
			expect(cycle.unit).toBe(lifts.unit);
		}),
	);

	it.effect("createEntity with partial 1RMs (mix of numbers and nulls)", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLiftsWithNulls();
			const cycle = yield* service.createEntity(crypto.randomUUID(), lifts, 1);

			expect(cycle.squat1rm).toBe(lifts.squat);
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.deadlift1rm).toBe(lifts.deadlift);
			expect(cycle.ohp1rm).toBeNull();
		}),
	);

	it.effect("advancePosition: day 1 to day 2", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentDay).toBe(2);
			expect(advanced.currentRound).toBe(1);
		}),
	);

	it.effect("advancePosition: day 3 to day 4", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const base = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const cycle = new Cycle({
				...base,
				currentDay: 3 as never,
			});
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentDay).toBe(4);
			expect(advanced.currentRound).toBe(1);
		}),
	);

	it.effect("advancePosition: day 4 advances to next round day 1", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const base = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const cycle = new Cycle({
				...base,
				currentDay: 4 as never,
				currentRound: 2 as never,
			});
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.currentRound).toBe(3);
			expect(advanced.currentDay).toBe(1);
		}),
	);

	it.effect("advancePosition: round 4 day 4 sets completedAt", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const base = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const cycle = new Cycle({
				...base,
				currentRound: 4 as never,
				currentDay: 4 as never,
			});
			const advanced = yield* service.advancePosition(cycle);

			expect(advanced.completedAt).toBeInstanceOf(Date);
			expect(advanced.currentRound).toBe(4);
			expect(advanced.currentDay).toBe(4);
		}),
	);

	it.effect("advancePosition returns a new object (immutability)", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const original = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const advanced = yield* service.advancePosition(original);

			expect(advanced).not.toBe(original);
			expect(original.currentDay).toBe(1);
			expect(advanced.currentDay).toBe(2);
		}),
	);

	it.effect("isComplete: false for active cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			expect(service.isComplete(cycle)).toBe(false);
		}),
	);

	it.effect("isComplete: true for completed cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const base = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const cycle = new Cycle({
				...base,
				completedAt: new Date(),
			});
			expect(service.isComplete(cycle)).toBe(true);
		}),
	);

	it.effect("validateActiveCycle returns cycle when not null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const validated = yield* service.validateActiveCycle(cycle);

			expect(validated).toEqual(cycle);
		}),
	);

	it.effect("validateActiveCycle fails with NotFoundError when null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const error = yield* service.validateActiveCycle(null).pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
			expect(error.message).toBe("No active cycle found");
			expect(error.resource).toBe("cycle");
		}),
	);

	it.effect.prop(
		"createEntity always starts at round 1, day 1",
		{
			lifts: Schema.toArbitrary(UserLifts),
			cycleNum: Schema.toArbitrary(
				Schema.Int.check(
					Schema.isGreaterThanOrEqualTo(1),
					Schema.isLessThanOrEqualTo(100),
				),
			),
		},
		({ lifts, cycleNum }) =>
			Effect.gen(function* () {
				const service = yield* CycleService;
				const cycle = yield* service.createEntity(
					crypto.randomUUID(),
					lifts,
					cycleNum,
				);
				expect(cycle.currentRound).toBe(1);
				expect(cycle.currentDay).toBe(1);
				expect(cycle.completedAt).toBeNull();
			}),
	);
});
