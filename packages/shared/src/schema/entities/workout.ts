import { Effect, Schema } from "effect";
import { InternalError } from "../../errors/index.js";
import { Round, TrainingDay } from "../program.js";

const UUID = Schema.String.check(Schema.isUUID());

// The entity — single source of truth for Workout domain type
export class Workout extends Schema.Class<Workout>("Workout")({
	id: UUID,
	userId: UUID,
	cycleId: UUID,
	round: Round,
	day: TrainingDay,
	startedAt: Schema.Date,
	completedAt: Schema.NullOr(Schema.Date),
}) {
	// Decode schema for Drizzle rows (no numeric columns — all integers)
	static readonly DrizzleRow = Schema.Struct({
		id: Schema.String,
		userId: Schema.String,
		cycleId: Schema.String,
		round: Schema.Number,
		day: Schema.Number,
		startedAt: Schema.Date,
		completedAt: Schema.NullOr(Schema.Date),
	});

	static decodeRow(row: unknown) {
		return Schema.decodeUnknownEffect(Workout.DrizzleRow)(row).pipe(
			Effect.map((data) => new Workout(data as never)),
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `Workout decode failed: ${e}`,
					}),
			),
		);
	}

	static toResponse(workout: Workout) {
		return {
			id: workout.id,
			userId: workout.userId,
			cycleId: workout.cycleId,
			round: workout.round as number,
			day: workout.day as number,
			startedAt: workout.startedAt.toISOString(),
			completedAt: workout.completedAt?.toISOString() ?? null,
		};
	}

	static toDbInsert(workout: Workout) {
		return {
			userId: workout.userId,
			cycleId: workout.cycleId,
			round: workout.round,
			day: workout.day,
		};
	}
}
