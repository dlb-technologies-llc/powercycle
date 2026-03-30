import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import { Cycle } from "../../src/schema/entities/cycle.js";

const sample = () => {
	const arb = Schema.toArbitrary(Cycle);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

describe("Cycle entity", () => {
	it("constructs with valid data", () => {
		const data = sample();
		const cycle = new Cycle(data);
		expect(cycle.id).toBe(data.id);
		expect(cycle.userId).toBe(data.userId);
		expect(cycle.cycleNumber).toBe(data.cycleNumber);
		expect(cycle.squat1rm).toBe(data.squat1rm);
		expect(cycle.unit).toBe(data.unit);
		expect(cycle.currentRound).toBe(data.currentRound);
		expect(cycle.currentDay).toBe(data.currentDay);
	});

	it("constructs with null 1RM values", () => {
		const cycle = new Cycle({
			...sample(),
			squat1rm: null,
			bench1rm: null,
			deadlift1rm: null,
			ohp1rm: null,
		});
		expect(cycle.squat1rm).toBeNull();
		expect(cycle.bench1rm).toBeNull();
		expect(cycle.deadlift1rm).toBeNull();
		expect(cycle.ohp1rm).toBeNull();
	});

	it("rejects invalid round value", () => {
		expect(
			() =>
				new Cycle({
					...sample(),
					currentRound: 5 as never,
				}),
		).toThrow();
	});

	it("rejects invalid day value", () => {
		expect(
			() =>
				new Cycle({
					...sample(),
					currentDay: 0 as never,
				}),
		).toThrow();
	});

	it("rejects invalid unit value", () => {
		expect(
			() =>
				new Cycle({
					...sample(),
					unit: "stones" as never,
				}),
		).toThrow();
	});

	it("rejects cycleNumber less than 1", () => {
		expect(
			() =>
				new Cycle({
					...sample(),
					cycleNumber: 0,
				}),
		).toThrow();
	});
});

describe("Cycle.decodeRow", () => {
	it.effect("decodes Drizzle row with string numerics", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				squat1rm: base.squat1rm != null ? String(base.squat1rm) : null,
				bench1rm: base.bench1rm != null ? String(base.bench1rm) : null,
				deadlift1rm: base.deadlift1rm != null ? String(base.deadlift1rm) : null,
				ohp1rm: base.ohp1rm != null ? String(base.ohp1rm) : null,
			};

			// String(-0) → "0" → Number("0") → +0, so the roundtrip normalizes -0
			const normalize = (v: number | null) =>
				v != null ? Number(String(v)) : null;

			const cycle = yield* Cycle.decodeRow(drizzleRow);
			expect(cycle).toBeInstanceOf(Cycle);
			expect(cycle.squat1rm).toBe(normalize(base.squat1rm));
			expect(cycle.bench1rm).toBe(normalize(base.bench1rm));
			expect(cycle.deadlift1rm).toBe(normalize(base.deadlift1rm));
			expect(cycle.ohp1rm).toBe(normalize(base.ohp1rm));
			expect(cycle.unit).toBe(base.unit);
		}),
	);

	it.effect("decodes Drizzle row with null numerics", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				squat1rm: null,
				bench1rm: null,
				deadlift1rm: null,
				ohp1rm: null,
			};

			const cycle = yield* Cycle.decodeRow(drizzleRow);
			expect(cycle).toBeInstanceOf(Cycle);
			expect(cycle.squat1rm).toBeNull();
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.cycleNumber).toBe(base.cycleNumber);
			expect(cycle.unit).toBe(base.unit);
		}),
	);
});

describe("Cycle.toResponse", () => {
	it("converts dates to ISO strings", () => {
		const data = sample();
		const cycle = new Cycle(data);

		const response = Cycle.toResponse(cycle);
		expect(response.startedAt).toBe(data.startedAt.toISOString());
		expect(response.completedAt).toBe(data.completedAt?.toISOString() ?? null);
	});

	it("handles null completedAt", () => {
		const cycle = new Cycle({ ...sample(), completedAt: null });
		const response = Cycle.toResponse(cycle);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values for round and day", () => {
		const cycle = new Cycle(sample());
		const response = Cycle.toResponse(cycle);
		expect(typeof response.currentRound).toBe("number");
		expect(typeof response.currentDay).toBe("number");
	});
});

describe("Cycle.toDbInsert", () => {
	it("converts number 1RMs to strings", () => {
		const cycle = new Cycle(sample());
		const insert = Cycle.toDbInsert(cycle);
		if (cycle.squat1rm != null) {
			expect(insert.squat1rm).toBe(String(cycle.squat1rm));
		} else {
			expect(insert.squat1rm).toBeNull();
		}
		if (cycle.bench1rm != null) {
			expect(insert.bench1rm).toBe(String(cycle.bench1rm));
		} else {
			expect(insert.bench1rm).toBeNull();
		}
		if (cycle.deadlift1rm != null) {
			expect(insert.deadlift1rm).toBe(String(cycle.deadlift1rm));
		} else {
			expect(insert.deadlift1rm).toBeNull();
		}
		if (cycle.ohp1rm != null) {
			expect(insert.ohp1rm).toBe(String(cycle.ohp1rm));
		} else {
			expect(insert.ohp1rm).toBeNull();
		}
	});

	it("preserves null 1RMs", () => {
		const cycle = new Cycle({
			...sample(),
			squat1rm: null,
			bench1rm: null,
			deadlift1rm: null,
			ohp1rm: null,
		});
		const insert = Cycle.toDbInsert(cycle);
		expect(insert.squat1rm).toBeNull();
		expect(insert.bench1rm).toBeNull();
		expect(insert.deadlift1rm).toBeNull();
		expect(insert.ohp1rm).toBeNull();
	});

	it("does not include id or timestamps", () => {
		const cycle = new Cycle(sample());
		const insert = Cycle.toDbInsert(cycle);
		expect("id" in insert).toBe(false);
		expect("startedAt" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});
});

describe("Cycle arbitrary safety", () => {
	it("generates 1000+ samples with valid ISO-serializable dates", () => {
		const arb = Schema.toArbitrary(Cycle);
		const samples = FastCheck.sample(arb.arb, 1100).map(arb.mapper);
		expect(samples.length).toBeGreaterThanOrEqual(1000);

		for (const data of samples) {
			const cycle = new Cycle(data);
			expect(() => cycle.startedAt.toISOString()).not.toThrow();
			if (cycle.completedAt !== null) {
				expect(() => cycle.completedAt?.toISOString()).not.toThrow();
			}
		}
	});
});
