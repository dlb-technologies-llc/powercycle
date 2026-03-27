import { describe, expect, it } from "@effect/vitest";
import { calculateCycleProgression } from "@powercycle/shared";
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

describe("cycles handler logic", () => {
	it.effect("creates cycle entity with correct defaults", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLifts();
			const entity = yield* service.createEntity(crypto.randomUUID(), lifts, 1);
			expect(entity.cycleNumber).toBe(1);
			expect(entity.currentRound).toBe(1);
			expect(entity.currentDay).toBe(1);
			expect(entity.completedAt).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("creates cycle entity with nullable 1RMs", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLiftsWithNulls();
			const entity = yield* service.createEntity(crypto.randomUUID(), lifts, 1);
			expect(entity.squat1rm).toBe(lifts.squat);
			expect(entity.bench1rm).toBeNull();
			expect(entity.deadlift1rm).toBe(lifts.deadlift);
			expect(entity.ohp1rm).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("validates active cycle — returns cycle when found", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(
				crypto.randomUUID(),
				sampleLifts(),
				1,
			);
			const result = yield* service.validateActiveCycle(cycle);
			expect(result.id).toBe(cycle.id);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("validates active cycle — fails when null", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const error = yield* service.validateActiveCycle(null).pipe(Effect.flip);
			expect(error._tag).toBe("NotFoundError");
		}).pipe(Effect.provide(CycleLive)),
	);

	it("calculates progression correctly", () => {
		const amrapResults = {
			squat: { weight: 300, reps: 5 },
			bench: { weight: 225, reps: 5 },
			deadlift: { weight: 385, reps: 5 },
			ohp: { weight: 142, reps: 5 },
		};
		const currentLifts = { squat: 315, bench: 235, deadlift: 405, ohp: 150 };
		const result = calculateCycleProgression(amrapResults, currentLifts);
		expect(result.squat.currentMax).toBe(315);
		expect(result.squat.newMax).toBeGreaterThanOrEqual(315);
	});

	it.effect("next cycle handler advances correctly", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLifts();
			const cycle = yield* service.createEntity(crypto.randomUUID(), lifts, 2);
			expect(cycle.cycleNumber).toBe(2);
			expect(cycle.squat1rm).toBe(lifts.squat);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("next cycle handler works with nullable 1RMs", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const lifts = sampleLiftsWithNulls();
			const cycle = yield* service.createEntity(crypto.randomUUID(), lifts, 2);
			expect(cycle.cycleNumber).toBe(2);
			expect(cycle.squat1rm).toBe(lifts.squat);
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.ohp1rm).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);
});
