import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import { ExerciseWeight } from "../../src/schema/entities/exercise-weight.js";

const sample = () => {
	const arb = Schema.toArbitrary(ExerciseWeight);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

describe("ExerciseWeight entity", () => {
	it("constructs with valid data", () => {
		const data = sample();
		const ew = new ExerciseWeight(data);
		expect(ew.id).toBe(data.id);
		expect(ew.userId).toBe(data.userId);
		expect(ew.exerciseName).toBe(data.exerciseName);
		expect(ew.weight).toBe(data.weight);
		expect(ew.unit).toBe(data.unit);
		expect(ew.rpe).toBe(data.rpe);
	});

	it("constructs with null rpe", () => {
		const ew = new ExerciseWeight({ ...sample(), rpe: null });
		expect(ew.rpe).toBeNull();
	});

	it("rejects invalid unit value", () => {
		expect(
			() =>
				new ExerciseWeight({
					...sample(),
					unit: "stones" as never,
				}),
		).toThrow();
	});
});

describe("ExerciseWeight.decodeRow", () => {
	it.effect("decodes Drizzle row with string weight and rpe", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				weight: String(base.weight),
				rpe: base.rpe != null ? String(base.rpe) : null,
			};

			const ew = yield* ExerciseWeight.decodeRow(drizzleRow);
			expect(ew).toBeInstanceOf(ExerciseWeight);
			expect(ew.weight).toBe(base.weight);
			expect(ew.rpe).toBe(base.rpe);
		}),
	);

	it.effect("decodes Drizzle row with null rpe", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				weight: String(base.weight),
				rpe: null,
			};

			const ew = yield* ExerciseWeight.decodeRow(drizzleRow);
			expect(ew).toBeInstanceOf(ExerciseWeight);
			expect(ew.weight).toBe(base.weight);
			expect(ew.rpe).toBeNull();
			expect(ew.unit).toBe(base.unit);
		}),
	);
});

describe("ExerciseWeight.toResponse", () => {
	it("converts date to ISO string", () => {
		const updatedAt = new Date("2024-01-15T00:00:00.000Z");
		const ew = new ExerciseWeight({ ...sample(), updatedAt });
		const response = ExerciseWeight.toResponse(ew);
		expect(response.updatedAt).toBe("2024-01-15T00:00:00.000Z");
	});

	it("includes all fields", () => {
		const data = sample();
		const ew = new ExerciseWeight(data);
		const response = ExerciseWeight.toResponse(ew);
		expect(response.id).toBe(data.id);
		expect(response.exerciseName).toBe(data.exerciseName);
		expect(response.weight).toBe(data.weight);
		expect(response.unit).toBe(data.unit);
		expect(response.rpe).toBe(data.rpe);
	});
});

describe("ExerciseWeight.toDbInsert", () => {
	it("converts numbers to strings", () => {
		const ew = new ExerciseWeight(sample());
		const insert = ExerciseWeight.toDbInsert(ew);
		expect(insert.weight).toBe(String(ew.weight));
		if (ew.rpe != null) {
			expect(insert.rpe).toBe(String(ew.rpe));
		} else {
			expect(insert.rpe).toBeNull();
		}
	});

	it("preserves null rpe", () => {
		const ew = new ExerciseWeight({ ...sample(), rpe: null });
		const insert = ExerciseWeight.toDbInsert(ew);
		expect(insert.rpe).toBeNull();
	});

	it("does not include id or timestamps", () => {
		const ew = new ExerciseWeight(sample());
		const insert = ExerciseWeight.toDbInsert(ew);
		expect("id" in insert).toBe(false);
		expect("updatedAt" in insert).toBe(false);
	});
});
