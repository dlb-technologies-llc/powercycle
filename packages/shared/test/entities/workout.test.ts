import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { Workout } from "../../src/schema/entities/workout.js";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440000";
const validUUID3 = "770e8400-e29b-41d4-a716-446655440000";

const validWorkoutData = {
	id: validUUID,
	userId: validUUID2,
	cycleId: validUUID3,
	round: 1 as const,
	day: 1 as const,
	startedAt: new Date("2024-01-01T00:00:00.000Z"),
	completedAt: null,
};

describe("Workout entity", () => {
	it("constructs with valid data", () => {
		const workout = new Workout(validWorkoutData);
		expect(workout.id).toBe(validUUID);
		expect(workout.userId).toBe(validUUID2);
		expect(workout.cycleId).toBe(validUUID3);
		expect(workout.round).toBe(1);
		expect(workout.day).toBe(1);
		expect(workout.startedAt).toBeInstanceOf(Date);
		expect(workout.completedAt).toBeNull();
	});

	it("constructs with completedAt date", () => {
		const completedAt = new Date("2024-01-01T01:00:00.000Z");
		const workout = new Workout({
			...validWorkoutData,
			completedAt,
		});
		expect(workout.completedAt).toEqual(completedAt);
	});

	it("rejects invalid round value", () => {
		expect(
			() =>
				new Workout({
					...validWorkoutData,
					round: 5 as never,
				}),
		).toThrow();
	});

	it("rejects invalid day value", () => {
		expect(
			() =>
				new Workout({
					...validWorkoutData,
					day: 0 as never,
				}),
		).toThrow();
	});

	it("rejects invalid UUID", () => {
		expect(
			() =>
				new Workout({
					...validWorkoutData,
					id: "not-a-uuid",
				}),
		).toThrow();
	});
});

describe("Workout.decodeRow", () => {
	it.effect("decodes Drizzle row with Date objects", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				cycleId: validUUID3,
				round: 2,
				day: 3,
				startedAt: new Date("2024-01-01T00:00:00.000Z"),
				completedAt: null,
			};

			const workout = yield* Workout.decodeRow(drizzleRow);
			expect(workout).toBeInstanceOf(Workout);
			expect(workout.round).toBe(2);
			expect(workout.day).toBe(3);
			expect(workout.cycleId).toBe(validUUID3);
		}),
	);

	it.effect("decodes Drizzle row with completedAt", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				cycleId: validUUID3,
				round: 1,
				day: 4,
				startedAt: new Date("2024-01-01T00:00:00.000Z"),
				completedAt: new Date("2024-01-01T01:30:00.000Z"),
			};

			const workout = yield* Workout.decodeRow(drizzleRow);
			expect(workout).toBeInstanceOf(Workout);
			expect(workout.completedAt).toEqual(new Date("2024-01-01T01:30:00.000Z"));
		}),
	);
});

describe("Workout.toResponse", () => {
	it("converts dates to ISO strings", () => {
		const startedAt = new Date("2024-01-01T00:00:00.000Z");
		const completedAt = new Date("2024-01-01T01:30:00.000Z");
		const workout = new Workout({
			...validWorkoutData,
			startedAt,
			completedAt,
		});

		const response = Workout.toResponse(workout);
		expect(response.startedAt).toBe("2024-01-01T00:00:00.000Z");
		expect(response.completedAt).toBe("2024-01-01T01:30:00.000Z");
	});

	it("handles null completedAt", () => {
		const workout = new Workout(validWorkoutData);
		const response = Workout.toResponse(workout);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values for round and day", () => {
		const workout = new Workout(validWorkoutData);
		const response = Workout.toResponse(workout);
		expect(typeof response.round).toBe("number");
		expect(typeof response.day).toBe("number");
	});
});

describe("Workout.toDbInsert", () => {
	it("omits id and timestamps", () => {
		const workout = new Workout(validWorkoutData);
		const insert = Workout.toDbInsert(workout);
		expect("id" in insert).toBe(false);
		expect("startedAt" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});

	it("includes userId, cycleId, round, and day", () => {
		const workout = new Workout(validWorkoutData);
		const insert = Workout.toDbInsert(workout);
		expect(insert.userId).toBe(validUUID2);
		expect(insert.cycleId).toBe(validUUID3);
		expect(insert.round).toBe(1);
		expect(insert.day).toBe(1);
	});
});
