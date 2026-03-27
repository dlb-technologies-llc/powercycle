import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { ExerciseWeight } from "../../src/schema/entities/exercise-weight.js";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440000";

const validData = {
	id: validUUID,
	userId: validUUID2,
	exerciseName: "Barbell Row",
	weight: 185,
	unit: "lbs" as const,
	rpe: 8,
	updatedAt: new Date("2024-01-15T00:00:00.000Z"),
};

describe("ExerciseWeight entity", () => {
	it("constructs with valid data", () => {
		const ew = new ExerciseWeight(validData);
		expect(ew.id).toBe(validUUID);
		expect(ew.userId).toBe(validUUID2);
		expect(ew.exerciseName).toBe("Barbell Row");
		expect(ew.weight).toBe(185);
		expect(ew.unit).toBe("lbs");
		expect(ew.rpe).toBe(8);
	});

	it("constructs with null rpe", () => {
		const ew = new ExerciseWeight({ ...validData, rpe: null });
		expect(ew.rpe).toBeNull();
	});

	it("rejects invalid unit value", () => {
		expect(
			() =>
				new ExerciseWeight({
					...validData,
					unit: "stones" as never,
				}),
		).toThrow();
	});
});

describe("ExerciseWeight.decodeRow", () => {
	it.effect("decodes Drizzle row with string weight and rpe", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				exerciseName: "Barbell Row",
				weight: "185",
				unit: "lbs",
				rpe: "8",
				updatedAt: new Date("2024-01-15T00:00:00.000Z"),
			};

			const ew = yield* ExerciseWeight.decodeRow(drizzleRow);
			expect(ew).toBeInstanceOf(ExerciseWeight);
			expect(ew.weight).toBe(185);
			expect(ew.rpe).toBe(8);
		}),
	);

	it.effect("decodes Drizzle row with null rpe", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				userId: validUUID2,
				exerciseName: "Barbell Row",
				weight: "225",
				unit: "kg",
				rpe: null,
				updatedAt: new Date("2024-06-01T00:00:00.000Z"),
			};

			const ew = yield* ExerciseWeight.decodeRow(drizzleRow);
			expect(ew).toBeInstanceOf(ExerciseWeight);
			expect(ew.weight).toBe(225);
			expect(ew.rpe).toBeNull();
			expect(ew.unit).toBe("kg");
		}),
	);
});

describe("ExerciseWeight.toResponse", () => {
	it("converts date to ISO string", () => {
		const ew = new ExerciseWeight(validData);
		const response = ExerciseWeight.toResponse(ew);
		expect(response.updatedAt).toBe("2024-01-15T00:00:00.000Z");
	});

	it("includes all fields", () => {
		const ew = new ExerciseWeight(validData);
		const response = ExerciseWeight.toResponse(ew);
		expect(response.id).toBe(validUUID);
		expect(response.exerciseName).toBe("Barbell Row");
		expect(response.weight).toBe(185);
		expect(response.unit).toBe("lbs");
		expect(response.rpe).toBe(8);
	});
});

describe("ExerciseWeight.toDbInsert", () => {
	it("converts numbers to strings", () => {
		const ew = new ExerciseWeight(validData);
		const insert = ExerciseWeight.toDbInsert(ew);
		expect(insert.weight).toBe("185");
		expect(insert.rpe).toBe("8");
	});

	it("preserves null rpe", () => {
		const ew = new ExerciseWeight({ ...validData, rpe: null });
		const insert = ExerciseWeight.toDbInsert(ew);
		expect(insert.rpe).toBeNull();
	});

	it("does not include id or timestamps", () => {
		const ew = new ExerciseWeight(validData);
		const insert = ExerciseWeight.toDbInsert(ew);
		expect("id" in insert).toBe(false);
		expect("updatedAt" in insert).toBe(false);
	});
});
