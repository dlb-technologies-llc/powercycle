import { describe, expect, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { FastCheck } from "effect/testing";
import {
	LogSetInput,
	WorkoutSet,
} from "../../src/schema/entities/workout-set.js";

const sample = () => {
	const arb = Schema.toArbitrary(WorkoutSet);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

const sampleLogSetInput = () => {
	const arb = Schema.toArbitrary(LogSetInput);
	return FastCheck.sample(arb.arb, 1).map(arb.mapper)[0]!;
};

describe("WorkoutSet entity", () => {
	it("constructs with valid data", () => {
		const data = sample();
		const set = new WorkoutSet(data);
		expect(set.id).toBe(data.id);
		expect(set.workoutId).toBe(data.workoutId);
		expect(set.exerciseName).toBe(data.exerciseName);
		expect(set.category).toBe(data.category);
		expect(set.setNumber).toBe(data.setNumber);
		expect(set.prescribedWeight).toBe(data.prescribedWeight);
		expect(set.actualWeight).toBe(data.actualWeight);
		expect(set.rpe).toBe(data.rpe);
		expect(set.isMainLift).toBe(data.isMainLift);
		expect(set.isAmrap).toBe(data.isAmrap);
	});

	it("constructs with null optional fields", () => {
		const set = new WorkoutSet({
			...sample(),
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
					...sample(),
					setNumber: 0,
				}),
		).toThrow();
	});
});

describe("WorkoutSet.decodeRow", () => {
	it.effect("decodes Drizzle row with string numerics", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
				prescribedWeight:
					base.prescribedWeight != null ? String(base.prescribedWeight) : null,
				actualWeight:
					base.actualWeight != null ? String(base.actualWeight) : null,
				prescribedRpeMin:
					base.prescribedRpeMin != null ? String(base.prescribedRpeMin) : null,
				prescribedRpeMax:
					base.prescribedRpeMax != null ? String(base.prescribedRpeMax) : null,
				rpe: base.rpe != null ? String(base.rpe) : null,
			};

			const set = yield* WorkoutSet.decodeRow(drizzleRow);
			expect(set).toBeInstanceOf(WorkoutSet);
			expect(set.prescribedWeight).toBe(base.prescribedWeight);
			expect(set.actualWeight).toBe(base.actualWeight);
			expect(set.prescribedRpeMin).toBe(base.prescribedRpeMin);
			expect(set.prescribedRpeMax).toBe(base.prescribedRpeMax);
			expect(set.rpe).toBe(base.rpe);
		}),
	);

	it.effect("decodes Drizzle row with null numerics", () =>
		Effect.gen(function* () {
			const base = sample();
			const drizzleRow = {
				...base,
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
		const completedAt = new Date("2024-01-15T10:30:00.000Z");
		const set = new WorkoutSet({ ...sample(), completedAt });
		const response = WorkoutSet.toResponse(set);
		expect(response.completedAt).toBe("2024-01-15T10:30:00.000Z");
	});

	it("handles null completedAt", () => {
		const set = new WorkoutSet({ ...sample(), completedAt: null });
		const response = WorkoutSet.toResponse(set);
		expect(response.completedAt).toBeNull();
	});

	it("returns plain number values", () => {
		const set = new WorkoutSet(sample());
		const response = WorkoutSet.toResponse(set);
		expect(typeof response.setNumber).toBe("number");
		if (set.prescribedWeight != null) {
			expect(typeof response.prescribedWeight).toBe("number");
		}
	});
});

describe("WorkoutSet.toDbInsert", () => {
	it("converts numeric columns to strings", () => {
		const set = new WorkoutSet(sample());
		const insert = WorkoutSet.toDbInsert(set);
		if (set.prescribedWeight != null) {
			expect(insert.prescribedWeight).toBe(String(set.prescribedWeight));
		} else {
			expect(insert.prescribedWeight).toBeNull();
		}
		if (set.actualWeight != null) {
			expect(insert.actualWeight).toBe(String(set.actualWeight));
		} else {
			expect(insert.actualWeight).toBeNull();
		}
		if (set.prescribedRpeMin != null) {
			expect(insert.prescribedRpeMin).toBe(String(set.prescribedRpeMin));
		} else {
			expect(insert.prescribedRpeMin).toBeNull();
		}
		if (set.prescribedRpeMax != null) {
			expect(insert.prescribedRpeMax).toBe(String(set.prescribedRpeMax));
		} else {
			expect(insert.prescribedRpeMax).toBeNull();
		}
		if (set.rpe != null) {
			expect(insert.rpe).toBe(String(set.rpe));
		} else {
			expect(insert.rpe).toBeNull();
		}
	});

	it("preserves null numeric columns", () => {
		const set = new WorkoutSet({
			...sample(),
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
		const set = new WorkoutSet(sample());
		const insert = WorkoutSet.toDbInsert(set);
		expect("id" in insert).toBe(false);
		expect("completedAt" in insert).toBe(false);
	});
});

describe("LogSetInput", () => {
	it("validates with arbitrary data", () => {
		const input = sampleLogSetInput();
		expect(() => Schema.decodeUnknownSync(LogSetInput)(input)).not.toThrow();
	});

	it("validates with null optional fields", () => {
		const input = sampleLogSetInput();
		const withNulls = {
			...input,
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
		};
		const decoded = Schema.decodeUnknownSync(LogSetInput)(withNulls);
		expect(decoded.exerciseName).toBe(input.exerciseName);
		expect(decoded.setNumber).toBe(input.setNumber);
		expect(decoded.category).toBeNull();
		expect(decoded.prescribedWeight).toBeNull();
	});

	it("rejects missing required fields", () => {
		const input = {
			exerciseName: "Squat",
			// missing setNumber, isMainLift, isAmrap
		};
		expect(() => Schema.decodeUnknownSync(LogSetInput)(input)).toThrow();
	});
});
