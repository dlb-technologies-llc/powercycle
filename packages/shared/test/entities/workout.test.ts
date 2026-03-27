import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import { Workout } from "../../src/schema/entities/workout.js";

const sample = () => {
	const arb = Schema.toArbitrary(Workout);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

describe("Workout entity", () => {
	it("constructs with valid data", () => {
		const data = sample();
		const workout = new Workout(data);
		expect(workout.id).toBe(data.id);
		expect(workout.userId).toBe(data.userId);
		expect(workout.cycleId).toBe(data.cycleId);
		expect(workout.round).toBe(data.round);
		expect(workout.day).toBe(data.day);
		expect(workout.startedAt).toBeInstanceOf(Date);
		expect(workout.completedAt).toBe(data.completedAt);
	});

	it("constructs with completedAt date", () => {
		const completedAt = new Date("2024-01-01T01:00:00.000Z");
		const workout = new Workout({
			...sample(),
			completedAt,
		});
		expect(workout.completedAt).toEqual(completedAt);
	});

	it("rejects invalid round value", () => {
		expect(
			() =>
				new Workout({
					...sample(),
					round: 5 as never,
				}),
		).toThrow();
	});

	it("rejects invalid day value", () => {
		expect(
			() =>
				new Workout({
					...sample(),
					day: 0 as never,
				}),
		).toThrow();
	});

	it("rejects invalid UUID", () => {
		expect(
			() =>
				new Workout({
					...sample(),
					id: "not-a-uuid",
				}),
		).toThrow();
	});
});

describe("Workout.decodeRow", () => {
	it.effect("decodes Drizzle row with Date objects", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				completedAt: null,
			};

			const workout = yield* Workout.decodeRow(drizzleRow);
			expect(workout).toBeInstanceOf(Workout);
			expect(workout.round).toBe(base.round);
			expect(workout.day).toBe(base.day);
			expect(workout.cycleId).toBe(base.cycleId);
		}),
	);

	it.effect("decodes Drizzle row with completedAt", () =>
		Effect.gen(function* () {
			const base = sample();
			const completedAt = new Date("2024-01-01T01:30:00.000Z");
			const drizzleRow = {
				...base,
				completedAt,
			};

			const workout = yield* Workout.decodeRow(drizzleRow);
			expect(workout).toBeInstanceOf(Workout);
			expect(workout.completedAt).toEqual(completedAt);
		}),
	);
});

describe("Workout.toResponse", () => {
	it("converts dates to ISO strings", () => {
		const startedAt = new Date("2024-01-01T00:00:00.000Z");
		const completedAt = new Date("2024-01-01T01:30:00.000Z");
		const workout = new Workout({
			...sample(),
			startedAt,
			completedAt,
		});

		const response = Workout.toResponse(workout);
		expect(response.startedAt).toBe("2024-01-01T00:00:00.000Z");
		expect(response.completedAt).toBe("2024-01-01T01:30:00.000Z");
	});

	it("handles null completedAt", () => {
		const workout = new Workout({ ...sample(), completedAt: null });
		const response = Workout.toResponse(workout);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values for round and day", () => {
		const workout = new Workout(sample());
		const response = Workout.toResponse(workout);
		expect(typeof response.round).toBe("number");
		expect(typeof response.day).toBe("number");
	});
});

describe("Workout.toDbInsert", () => {
	it("omits id and timestamps", () => {
		const workout = new Workout(sample());
		const insert = Workout.toDbInsert(workout);
		expect("id" in insert).toBe(false);
		expect("startedAt" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});

	it("includes userId, cycleId, round, and day", () => {
		const data = sample();
		const workout = new Workout(data);
		const insert = Workout.toDbInsert(workout);
		expect(insert.userId).toBe(data.userId);
		expect(insert.cycleId).toBe(data.cycleId);
		expect(insert.round).toBe(data.round);
		expect(insert.day).toBe(data.day);
	});
});
