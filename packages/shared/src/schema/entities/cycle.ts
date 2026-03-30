import { Effect, Schema } from "effect";
import { InternalError } from "../../errors/index.js";
import { UUID } from "../common.js";
import { Unit } from "../lifts.js";
import { Round, TrainingDay } from "../program.js";

// Date with constrained arbitrary — isBetweenDate feeds min/max into fc.date() constraints.
// Range is wide enough to never reject real production data (1970–2200).
const SafeArbitraryDate = Schema.Date.check(
	Schema.isBetweenDate({
		minimum: new Date("1970-01-01T00:00:00.000Z"),
		maximum: new Date("2200-01-01T00:00:00.000Z"),
	}),
);

// The entity — single source of truth for Cycle domain type
export class Cycle extends Schema.Class<Cycle>("Cycle")({
	id: UUID,
	userId: UUID,
	cycleNumber: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
	squat1rm: Schema.NullOr(Schema.Number),
	bench1rm: Schema.NullOr(Schema.Number),
	deadlift1rm: Schema.NullOr(Schema.Number),
	ohp1rm: Schema.NullOr(Schema.Number),
	unit: Unit,
	currentRound: Round,
	currentDay: TrainingDay,
	startedAt: SafeArbitraryDate,
	completedAt: Schema.NullOr(SafeArbitraryDate),
}) {
	// Decode schema for Drizzle rows (string numerics → numbers)
	static readonly DrizzleRow = Schema.Struct({
		id: UUID,
		userId: UUID,
		cycleNumber: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
		squat1rm: Schema.NullOr(Schema.NumberFromString),
		bench1rm: Schema.NullOr(Schema.NumberFromString),
		deadlift1rm: Schema.NullOr(Schema.NumberFromString),
		ohp1rm: Schema.NullOr(Schema.NumberFromString),
		unit: Unit,
		currentRound: Round,
		currentDay: TrainingDay,
		startedAt: Schema.Date,
		completedAt: Schema.NullOr(Schema.Date),
	});

	static decodeRow(row: unknown) {
		return Schema.decodeUnknownEffect(Cycle.DrizzleRow)(row).pipe(
			Effect.map((data) => new Cycle(data)),
			Effect.mapError(
				(e) =>
					new InternalError({
						message: `Cycle decode failed: ${e}`,
					}),
			),
		);
	}

	static toResponse(cycle: Cycle) {
		return {
			id: cycle.id,
			userId: cycle.userId,
			cycleNumber: cycle.cycleNumber,
			squat1rm: cycle.squat1rm,
			bench1rm: cycle.bench1rm,
			deadlift1rm: cycle.deadlift1rm,
			ohp1rm: cycle.ohp1rm,
			unit: cycle.unit,
			currentRound: cycle.currentRound,
			currentDay: cycle.currentDay,
			startedAt: cycle.startedAt.toISOString(),
			completedAt: cycle.completedAt?.toISOString() ?? null,
		};
	}

	static toDbInsert(cycle: Cycle) {
		return {
			userId: cycle.userId,
			cycleNumber: cycle.cycleNumber,
			squat1rm: cycle.squat1rm != null ? String(cycle.squat1rm) : null,
			bench1rm: cycle.bench1rm != null ? String(cycle.bench1rm) : null,
			deadlift1rm: cycle.deadlift1rm != null ? String(cycle.deadlift1rm) : null,
			ohp1rm: cycle.ohp1rm != null ? String(cycle.ohp1rm) : null,
			unit: cycle.unit,
			currentRound: cycle.currentRound,
			currentDay: cycle.currentDay,
		};
	}
}
