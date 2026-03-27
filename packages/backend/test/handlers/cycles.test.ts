import { describe, expect, it } from "@effect/vitest";
import { calculateCycleProgression } from "@powercycle/shared";
import { Effect } from "effect";
import { CycleLive, CycleService } from "../../src/services/CycleService.js";

const TEST_USER_ID = "00000000-0000-4000-a000-000000000001";

const testLifts = {
	squat: 315,
	bench: 235,
	deadlift: 405,
	ohp: 150,
	unit: "lbs",
};

const testLiftsWithNulls = {
	squat: 315,
	bench: null,
	deadlift: 405,
	ohp: null,
	unit: "lbs",
};

describe("cycles handler logic", () => {
	it.effect("creates cycle entity with correct defaults", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const entity = yield* service.createEntity(TEST_USER_ID, testLifts, 1);
			expect(entity.cycleNumber).toBe(1);
			expect(entity.currentRound).toBe(1);
			expect(entity.currentDay).toBe(1);
			expect(entity.completedAt).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("creates cycle entity with nullable 1RMs", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const entity = yield* service.createEntity(
				TEST_USER_ID,
				testLiftsWithNulls,
				1,
			);
			expect(entity.squat1rm).toBe(315);
			expect(entity.bench1rm).toBeNull();
			expect(entity.deadlift1rm).toBe(405);
			expect(entity.ohp1rm).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("validates active cycle — returns cycle when found", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(TEST_USER_ID, testLifts, 1);
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
			const cycle = yield* service.createEntity(
				TEST_USER_ID,
				{ squat: 320, bench: 240, deadlift: 410, ohp: 155, unit: "lbs" },
				2,
			);
			expect(cycle.cycleNumber).toBe(2);
			expect(cycle.squat1rm).toBe(320);
		}).pipe(Effect.provide(CycleLive)),
	);

	it.effect("next cycle handler works with nullable 1RMs", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createEntity(
				TEST_USER_ID,
				{ squat: 320, bench: null, deadlift: 410, ohp: null, unit: "lbs" },
				2,
			);
			expect(cycle.cycleNumber).toBe(2);
			expect(cycle.squat1rm).toBe(320);
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.ohp1rm).toBeNull();
		}).pipe(Effect.provide(CycleLive)),
	);
});
