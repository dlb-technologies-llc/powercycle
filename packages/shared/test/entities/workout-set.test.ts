import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import {
	LogSetInput,
	WorkoutSet,
} from "../../src/schema/entities/workout-set.js";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "660e8400-e29b-41d4-a716-446655440000";

const validSetData = {
	id: validUUID,
	workoutId: validUUID2,
	exerciseName: "Squat",
	category: "main",
	setNumber: 1,
	prescribedWeight: 315,
	actualWeight: 315,
	prescribedReps: 5,
	actualReps: 5,
	prescribedRpeMin: 7,
	prescribedRpeMax: 8,
	rpe: 7.5,
	isMainLift: true,
	isAmrap: false,
	setDuration: 45,
	restDuration: 180,
	completedAt: new Date("2024-01-15T10:30:00.000Z"),
};

describe("WorkoutSet entity", () => {
	it("constructs with valid data", () => {
		const set = new WorkoutSet(validSetData);
		expect(set.id).toBe(validUUID);
		expect(set.workoutId).toBe(validUUID2);
		expect(set.exerciseName).toBe("Squat");
		expect(set.category).toBe("main");
		expect(set.setNumber).toBe(1);
		expect(set.prescribedWeight).toBe(315);
		expect(set.actualWeight).toBe(315);
		expect(set.rpe).toBe(7.5);
		expect(set.isMainLift).toBe(true);
		expect(set.isAmrap).toBe(false);
	});

	it("constructs with null optional fields", () => {
		const set = new WorkoutSet({
			...validSetData,
			category: null,
			prescribedWeight: null,
			actualWeight: null,
			prescribedReps: null,
			actualReps: null,
			prescribedRpeMin: null,
			prescribedRpeMax: null,
			rpe: null,
			setDuration: null,
			restDuration: null,
			completedAt: null,
		});
		expect(set.category).toBeNull();
		expect(set.prescribedWeight).toBeNull();
		expect(set.actualWeight).toBeNull();
		expect(set.rpe).toBeNull();
		expect(set.completedAt).toBeNull();
	});

	it("rejects setNumber less than 1", () => {
		expect(
			() =>
				new WorkoutSet({
					...validSetData,
					setNumber: 0,
				}),
		).toThrow();
	});
});

describe("WorkoutSet.decodeRow", () => {
	it.effect("decodes Drizzle row with string numerics", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				workoutId: validUUID2,
				exerciseName: "Squat",
				category: "main",
				setNumber: 1,
				prescribedWeight: "315",
				actualWeight: "310",
				prescribedReps: 5,
				actualReps: 5,
				prescribedRpeMin: "7",
				prescribedRpeMax: "8",
				rpe: "7.5",
				isMainLift: true,
				isAmrap: false,
				setDuration: 45,
				restDuration: 180,
				completedAt: new Date("2024-01-15T10:30:00.000Z"),
			};

			const set = yield* WorkoutSet.decodeRow(drizzleRow);
			expect(set).toBeInstanceOf(WorkoutSet);
			expect(set.prescribedWeight).toBe(315);
			expect(set.actualWeight).toBe(310);
			expect(set.prescribedRpeMin).toBe(7);
			expect(set.prescribedRpeMax).toBe(8);
			expect(set.rpe).toBe(7.5);
		}),
	);

	it.effect("decodes Drizzle row with null numerics", () =>
		Effect.gen(function* () {
			const drizzleRow = {
				id: validUUID,
				workoutId: validUUID2,
				exerciseName: "Squat",
				category: null,
				setNumber: 1,
				prescribedWeight: null,
				actualWeight: null,
				prescribedReps: null,
				actualReps: null,
				prescribedRpeMin: null,
				prescribedRpeMax: null,
				rpe: null,
				isMainLift: false,
				isAmrap: true,
				setDuration: null,
				restDuration: null,
				completedAt: null,
			};

			const set = yield* WorkoutSet.decodeRow(drizzleRow);
			expect(set).toBeInstanceOf(WorkoutSet);
			expect(set.prescribedWeight).toBeNull();
			expect(set.actualWeight).toBeNull();
			expect(set.rpe).toBeNull();
			expect(set.category).toBeNull();
			expect(set.completedAt).toBeNull();
		}),
	);
});

describe("WorkoutSet.toResponse", () => {
	it("converts completedAt date to ISO string", () => {
		const set = new WorkoutSet(validSetData);
		const response = WorkoutSet.toResponse(set);
		expect(response.completedAt).toBe("2024-01-15T10:30:00.000Z");
	});

	it("handles null completedAt", () => {
		const set = new WorkoutSet({ ...validSetData, completedAt: null });
		const response = WorkoutSet.toResponse(set);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values", () => {
		const set = new WorkoutSet(validSetData);
		const response = WorkoutSet.toResponse(set);
		expect(typeof response.setNumber).toBe("number");
		expect(typeof response.prescribedWeight).toBe("number");
	});
});

describe("WorkoutSet.toDbInsert", () => {
	it("converts numeric columns to strings", () => {
		const set = new WorkoutSet(validSetData);
		const insert = WorkoutSet.toDbInsert(set);
		expect(insert.prescribedWeight).toBe("315");
		expect(insert.actualWeight).toBe("315");
		expect(insert.prescribedRpeMin).toBe("7");
		expect(insert.prescribedRpeMax).toBe("8");
		expect(insert.rpe).toBe("7.5");
	});

	it("preserves null numeric columns", () => {
		const set = new WorkoutSet({
			...validSetData,
			prescribedWeight: null,
			actualWeight: null,
			prescribedRpeMin: null,
			prescribedRpeMax: null,
			rpe: null,
		});
		const insert = WorkoutSet.toDbInsert(set);
		expect(insert.prescribedWeight).toBeNull();
		expect(insert.actualWeight).toBeNull();
		expect(insert.prescribedRpeMin).toBeNull();
		expect(insert.prescribedRpeMax).toBeNull();
		expect(insert.rpe).toBeNull();
	});

	it("does not include id or completedAt", () => {
		const set = new WorkoutSet(validSetData);
		const insert = WorkoutSet.toDbInsert(set);
		expect("id" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});
});

describe("LogSetInput", () => {
	it("validates with all fields", () => {
		const input = {
			exerciseName: "Squat",
			category: "main",
			setNumber: 1,
			prescribedWeight: 315,
			actualWeight: 315,
			prescribedReps: 5,
			actualReps: 5,
			prescribedRpeMin: 7,
			prescribedRpeMax: 8,
			rpe: 7.5,
			setDuration: 45,
			restDuration: 180,
			isMainLift: true,
			isAmrap: false,
		};
		expect(() => Schema.decodeUnknownSync(LogSetInput)(input)).not.toThrow();
	});

	it("validates with only required fields", () => {
		const input = {
			exerciseName: "Squat",
			setNumber: 1,
			isMainLift: true,
			isAmrap: false,
		};
		const decoded = Schema.decodeUnknownSync(LogSetInput)(input);
		expect(decoded.exerciseName).toBe("Squat");
		expect(decoded.setNumber).toBe(1);
		expect(decoded.category).toBeUndefined();
		expect(decoded.prescribedWeight).toBeUndefined();
	});

	it("rejects missing required fields", () => {
		const input = {
			exerciseName: "Squat",
			// missing setNumber, isMainLift, isAmrap
		};
		expect(() => Schema.decodeUnknownSync(LogSetInput)(input)).toThrow();
	});
});
