import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { Cycle } from "../../src/schema/entities/cycle.js";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440000";

const validCycleData = {
	id: validUUID,
	userId: validUUID2,
	cycleNumber: 1,
	squat1rm: 315,
	bench1rm: 235,
	deadlift1rm: 405,
	ohp1rm: 150,
	unit: "lbs" as const,
	currentRound: 1 as const,
	currentDay: 1 as const,
	startedAt: new Date("2024-01-01T00:00:00.000Z"),
	completedAt: null,
};

describe("Cycle entity", () => {
	it("constructs with valid data", () => {
		const cycle = new Cycle(validCycleData);
		expect(cycle.id).toBe(validUUID);
		expect(cycle.userId).toBe(validUUID2);
		expect(cycle.cycleNumber).toBe(1);
		expect(cycle.squat1rm).toBe(315);
		expect(cycle.unit).toBe("lbs");
		expect(cycle.currentRound).toBe(1);
		expect(cycle.currentDay).toBe(1);
	});

	it("constructs with null 1RM values", () => {
		const cycle = new Cycle({
			...validCycleData,
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
					...validCycleData,
					currentRound: 5 as never,
				}),
		).toThrow();
	});

	it("rejects invalid day value", () => {
		expect(
			() =>
				new Cycle({
					...validCycleData,
					currentDay: 0 as never,
				}),
		).toThrow();
	});

	it("rejects invalid unit value", () => {
		expect(
			() =>
				new Cycle({
					...validCycleData,
					unit: "stones" as never,
				}),
		).toThrow();
	});

	it("rejects cycleNumber less than 1", () => {
		expect(
			() =>
				new Cycle({
					...validCycleData,
					cycleNumber: 0,
				}),
		).toThrow();
	});
});

describe("Cycle.decodeRow", () => {
	it.effect("decodes Drizzle row with string numerics", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				cycleNumber: 1,
				squat1rm: "315",
				bench1rm: "235",
				deadlift1rm: "405",
				ohp1rm: "150",
				unit: "lbs",
				currentRound: 1,
				currentDay: 1,
				startedAt: new Date("2024-01-01T00:00:00.000Z"),
				completedAt: null,
			};

			const cycle = yield* Cycle.decodeRow(drizzleRow);
			expect(cycle).toBeInstanceOf(Cycle);
			expect(cycle.squat1rm).toBe(315);
			expect(cycle.bench1rm).toBe(235);
			expect(cycle.deadlift1rm).toBe(405);
			expect(cycle.ohp1rm).toBe(150);
			expect(cycle.unit).toBe("lbs");
		}),
	);

	it.effect("decodes Drizzle row with null numerics", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				cycleNumber: 2,
				squat1rm: null,
				bench1rm: null,
				deadlift1rm: null,
				ohp1rm: null,
				unit: "kg",
				currentRound: 3,
				currentDay: 2,
				startedAt: new Date("2024-06-01T00:00:00.000Z"),
				completedAt: null,
			};

			const cycle = yield* Cycle.decodeRow(drizzleRow);
			expect(cycle).toBeInstanceOf(Cycle);
			expect(cycle.squat1rm).toBeNull();
			expect(cycle.bench1rm).toBeNull();
			expect(cycle.cycleNumber).toBe(2);
			expect(cycle.unit).toBe("kg");
		}),
	);
});

describe("Cycle.toResponse", () => {
	it("converts dates to ISO strings", () => {
		const startedAt = new Date("2024-01-01T00:00:00.000Z");
		const completedAt = new Date("2024-02-01T00:00:00.000Z");
		const cycle = new Cycle({
			...validCycleData,
			startedAt,
			completedAt,
		});

		const response = Cycle.toResponse(cycle);
		expect(response.startedAt).toBe("2024-01-01T00:00:00.000Z");
		expect(response.completedAt).toBe("2024-02-01T00:00:00.000Z");
	});

	it("handles null completedAt", () => {
		const cycle = new Cycle(validCycleData);
		const response = Cycle.toResponse(cycle);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values for round and day", () => {
		const cycle = new Cycle(validCycleData);
		const response = Cycle.toResponse(cycle);
		expect(typeof response.currentRound).toBe("number");
		expect(typeof response.currentDay).toBe("number");
	});
});

describe("Cycle.toDbInsert", () => {
	it("converts number 1RMs to strings", () => {
		const cycle = new Cycle(validCycleData);
		const insert = Cycle.toDbInsert(cycle);
		expect(insert.squat1rm).toBe("315");
		expect(insert.bench1rm).toBe("235");
		expect(insert.deadlift1rm).toBe("405");
		expect(insert.ohp1rm).toBe("150");
	});

	it("preserves null 1RMs", () => {
		const cycle = new Cycle({
			...validCycleData,
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
		const cycle = new Cycle(validCycleData);
		const insert = Cycle.toDbInsert(cycle);
		expect("id" in insert).toBe(false);
		expect("startedAt" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});
});
