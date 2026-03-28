import { Effect, Schema } from "effect";
import { InternalError } from "../../errors/index.js";
import { UUID } from "../common.js";
import { Unit } from "../lifts.js";

// The entity — single source of truth for ExerciseWeight domain type
export class ExerciseWeight extends Schema.Class<ExerciseWeight>(
	"ExerciseWeight",
)({
	id: UUID,
	userId: UUID,
	exerciseName: Schema.String,
	weight: Schema.Number,
	unit: Unit,
	rpe: Schema.NullOr(Schema.Number),
	updatedAt: Schema.Date,
}) {
	// Decode schema for Drizzle rows (string numerics → numbers)
	static readonly DrizzleRow = Schema.Struct({
		id: UUID,
		userId: UUID,
		exerciseName: Schema.String,
		weight: Schema.NumberFromString,
		unit: Unit,
		rpe: Schema.NullOr(Schema.NumberFromString),
		updatedAt: Schema.Date,
	});

	static decodeRow(row: unknown) {
		return Schema.decodeUnknownEffect(ExerciseWeight.DrizzleRow)(row).pipe(
			Effect.map((data) => new ExerciseWeight(data)),
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `ExerciseWeight decode failed: ${e}`,
					}),
			),
		);
	}

	static toResponse(ew: ExerciseWeight) {
		return {
			id: ew.id,
			userId: ew.userId,
			exerciseName: ew.exerciseName,
			weight: ew.weight,
			unit: ew.unit,
			rpe: ew.rpe,
			updatedAt: ew.updatedAt.toISOString(),
		};
	}

	static toDbInsert(ew: ExerciseWeight) {
		return {
			userId: ew.userId,
			exerciseName: ew.exerciseName,
			weight: String(ew.weight),
			unit: ew.unit,
			rpe: ew.rpe != null ? String(ew.rpe) : null,
		};
	}
}
