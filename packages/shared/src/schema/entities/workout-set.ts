import { Effect, Schema } from "effect";
import { InternalError } from "../../errors/index.js";
import { UUID } from "../common.js";

/** Set number within a workout (1-based). */
export const SetNumber = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));
export type SetNumber = typeof SetNumber.Type;

/** Non-negative rep count for prescribed/actual reps. */
export const RepCount = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));
export type RepCount = typeof RepCount.Type;

/** Duration in seconds (integer). */
export const DurationSeconds = Schema.Int;
export type DurationSeconds = typeof DurationSeconds.Type;

// The entity — single source of truth for WorkoutSet domain type
export class WorkoutSet extends Schema.Class<WorkoutSet>("WorkoutSet")({
	id: UUID,
	workoutId: UUID,
	exerciseName: Schema.String,
	category: Schema.NullOr(Schema.String),
	setNumber: SetNumber,
	prescribedWeight: Schema.NullOr(Schema.Number),
	actualWeight: Schema.NullOr(Schema.Number),
	prescribedReps: Schema.NullOr(Schema.Int),
	actualReps: Schema.NullOr(Schema.Int),
	prescribedRpeMin: Schema.NullOr(Schema.Number),
	prescribedRpeMax: Schema.NullOr(Schema.Number),
	rpe: Schema.NullOr(Schema.Number),
	isMainLift: Schema.Boolean,
	isAmrap: Schema.Boolean,
	setDuration: Schema.NullOr(DurationSeconds),
	restDuration: Schema.NullOr(DurationSeconds),
	skipped: Schema.Boolean,
	completedAt: Schema.NullOr(Schema.Date),
}) {
	// Decode schema for Drizzle rows (string numerics → numbers)
	static readonly DrizzleRow = Schema.Struct({
		id: UUID,
		workoutId: UUID,
		exerciseName: Schema.String,
		category: Schema.NullOr(Schema.String),
		setNumber: SetNumber,
		prescribedWeight: Schema.NullOr(Schema.NumberFromString),
		actualWeight: Schema.NullOr(Schema.NumberFromString),
		prescribedReps: Schema.NullOr(Schema.Int),
		actualReps: Schema.NullOr(Schema.Int),
		prescribedRpeMin: Schema.NullOr(Schema.NumberFromString),
		prescribedRpeMax: Schema.NullOr(Schema.NumberFromString),
		rpe: Schema.NullOr(Schema.NumberFromString),
		isMainLift: Schema.Boolean,
		isAmrap: Schema.Boolean,
		setDuration: Schema.NullOr(DurationSeconds),
		restDuration: Schema.NullOr(DurationSeconds),
		skipped: Schema.Boolean,
		completedAt: Schema.NullOr(Schema.Date),
	});

	// Decode schema for last-session query rows (subset of DrizzleRow fields)
	static readonly LastSessionRow = Schema.Struct({
		exerciseName: Schema.String,
		actualWeight: Schema.NullOr(Schema.NumberFromString),
		actualReps: Schema.NullOr(Schema.Number),
		rpe: Schema.NullOr(Schema.NumberFromString),
	});

	static decodeLastSessionRow(row: unknown) {
		return Schema.decodeUnknownEffect(WorkoutSet.LastSessionRow)(row).pipe(
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `LastSession decode failed: ${e}`,
					}),
			),
		);
	}

	static decodeRow(row: unknown) {
		return Schema.decodeUnknownEffect(WorkoutSet.DrizzleRow)(row).pipe(
			Effect.map((data) => new WorkoutSet(data)),
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `WorkoutSet decode failed: ${e}`,
					}),
			),
		);
	}

	static toResponse(set: WorkoutSet) {
		return {
			id: set.id,
			workoutId: set.workoutId,
			exerciseName: set.exerciseName,
			category: set.category,
			setNumber: set.setNumber,
			prescribedWeight: set.prescribedWeight,
			actualWeight: set.actualWeight,
			prescribedReps: set.prescribedReps,
			actualReps: set.actualReps,
			prescribedRpeMin: set.prescribedRpeMin,
			prescribedRpeMax: set.prescribedRpeMax,
			rpe: set.rpe,
			isMainLift: set.isMainLift,
			isAmrap: set.isAmrap,
			setDuration: set.setDuration,
			restDuration: set.restDuration,
			skipped: set.skipped,
			completedAt: set.completedAt?.toISOString() ?? null,
		};
	}

	static toDbInsert(set: WorkoutSet) {
		return {
			workoutId: set.workoutId,
			exerciseName: set.exerciseName,
			category: set.category,
			setNumber: set.setNumber,
			prescribedWeight:
				set.prescribedWeight != null ? String(set.prescribedWeight) : null,
			actualWeight: set.actualWeight != null ? String(set.actualWeight) : null,
			prescribedReps: set.prescribedReps,
			actualReps: set.actualReps,
			prescribedRpeMin:
				set.prescribedRpeMin != null ? String(set.prescribedRpeMin) : null,
			prescribedRpeMax:
				set.prescribedRpeMax != null ? String(set.prescribedRpeMax) : null,
			rpe: set.rpe != null ? String(set.rpe) : null,
			isMainLift: set.isMainLift,
			isAmrap: set.isAmrap,
			setDuration: set.setDuration,
			restDuration: set.restDuration,
			skipped: set.skipped,
		};
	}
}

// Standalone Schema.Struct for logging a new set (input from client)
// Uses NullOr to match entity fields — callers send null, not undefined
export const LogSetInput = Schema.Struct({
	exerciseName: Schema.String,
	category: Schema.NullOr(Schema.String),
	setNumber: SetNumber,
	prescribedWeight: Schema.NullOr(Schema.Number),
	actualWeight: Schema.NullOr(Schema.Number),
	prescribedReps: Schema.NullOr(RepCount),
	actualReps: Schema.NullOr(RepCount),
	prescribedRpeMin: Schema.NullOr(Schema.Number),
	prescribedRpeMax: Schema.NullOr(Schema.Number),
	rpe: Schema.NullOr(Schema.Number),
	setDuration: Schema.NullOr(DurationSeconds),
	restDuration: Schema.NullOr(DurationSeconds),
	isMainLift: Schema.Boolean,
	isAmrap: Schema.Boolean,
});
export type LogSetInput = typeof LogSetInput.Type;
