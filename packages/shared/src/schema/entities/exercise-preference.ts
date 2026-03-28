import { Effect, Schema } from "effect";
import { InternalError } from "../../errors/index.js";
import { UUID } from "../common.js";

// The entity — single source of truth for ExercisePreference domain type
export class ExercisePreference extends Schema.Class<ExercisePreference>(
	"ExercisePreference",
)({
	id: UUID,
	userId: UUID,
	slotKey: Schema.String,
	exerciseName: Schema.String,
	updatedAt: Schema.Date,
}) {
	// Decode schema for Drizzle rows (no numeric columns)
	static readonly DrizzleRow = Schema.Struct({
		id: Schema.String,
		userId: Schema.String,
		slotKey: Schema.String,
		exerciseName: Schema.String,
		updatedAt: Schema.Date,
	});

	static decodeRow(row: unknown) {
		return Schema.decodeUnknownEffect(ExercisePreference.DrizzleRow)(row).pipe(
			Effect.map((data) => new ExercisePreference(data as never)),
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `ExercisePreference decode failed: ${e}`,
					}),
			),
		);
	}

	static toResponse(ep: ExercisePreference) {
		return {
			slotKey: ep.slotKey,
			exerciseName: ep.exerciseName,
		};
	}
}
