import { Schema } from "effect";
import { RPE_MAX, RPE_MIN } from "../engine/workout.js";
import { Cycle } from "./entities/cycle.js";
import { ExercisePreference } from "./entities/exercise-preference.js";
import { ExerciseWeight } from "./entities/exercise-weight.js";
import { Workout } from "./entities/workout.js";
import { WorkoutSet } from "./entities/workout-set.js";
import { MainLift, UserLifts } from "./lifts.js";
import { PrescribedSet, RpeSet } from "./workout.js";

// --- RPE validation ---

export const RpeNumber = Schema.Number.check(
	Schema.isBetween({ minimum: RPE_MIN, maximum: RPE_MAX }),
);

// --- Cycle ---

export const CycleResponse = Schema.Struct({
	...Cycle.fields,
	// Date → String for JSON serialization
	startedAt: Schema.String,
	completedAt: Schema.NullOr(Schema.String),
});

export const NullableCycleResponse = Schema.NullOr(CycleResponse);

// --- WorkoutSet ---

export const SetResponse = Schema.Struct({
	...WorkoutSet.fields,
	// Date → String for JSON serialization
	completedAt: Schema.NullOr(Schema.String),
	// Int → Number for JSON serialization
	setNumber: Schema.Number,
	prescribedReps: Schema.NullOr(Schema.Number),
	actualReps: Schema.NullOr(Schema.Number),
	setDuration: Schema.NullOr(Schema.Number),
	restDuration: Schema.NullOr(Schema.Number),
});

// --- Workout ---

export const WorkoutResponse = Schema.Struct({
	...Workout.fields,
	// Date → String for JSON serialization
	startedAt: Schema.String,
	completedAt: Schema.NullOr(Schema.String),
	// Literal → Number for JSON serialization
	round: Schema.Number,
	day: Schema.Number,
});

export const WorkoutWithSetsResponse = Schema.Struct({
	...WorkoutResponse.fields,
	sets: Schema.Array(SetResponse),
});

// --- Value object schemas (derived from workout.ts) ---

export const PrescribedSetSchema = PrescribedSet;

export const RpeSetSchema = RpeSet;

export const LastSessionSchema = Schema.Struct({
	weight: Schema.NullOr(Schema.Number),
	reps: Schema.NullOr(Schema.Number),
	rpe: Schema.NullOr(Schema.Number),
});
export type LastSession = typeof LastSessionSchema.Type;

export const ExerciseSlotSchema = Schema.Struct({
	category: Schema.String,
	defaultExercise: Schema.String,
	sets: Schema.Array(RpeSetSchema),
	preferredWeight: Schema.NullOr(Schema.Number),
	suggestedWeight: Schema.NullOr(Schema.Number),
	lastSession: Schema.NullOr(LastSessionSchema),
});
export type EnrichedSlot = typeof ExerciseSlotSchema.Type;

export const WorkoutPlanResponse = Schema.Struct({
	day: Schema.Number,
	round: Schema.Number,
	cycle: Schema.Number,
	mainLift: MainLift,
	mainLiftSets: Schema.Array(PrescribedSetSchema),
	variation: ExerciseSlotSchema,
	accessories: Schema.Array(ExerciseSlotSchema),
});
export type WorkoutPlanResponseType = typeof WorkoutPlanResponse.Type;

// --- Progression (computed result, no entity) ---

export const ProgressionResponse = Schema.Struct({
	squat: Schema.Struct({
		currentMax: Schema.Number,
		newMax: Schema.Number,
		progressed: Schema.Boolean,
	}),
	bench: Schema.Struct({
		currentMax: Schema.Number,
		newMax: Schema.Number,
		progressed: Schema.Boolean,
	}),
	deadlift: Schema.Struct({
		currentMax: Schema.Number,
		newMax: Schema.Number,
		progressed: Schema.Boolean,
	}),
	ohp: Schema.Struct({
		currentMax: Schema.Number,
		newMax: Schema.Number,
		progressed: Schema.Boolean,
	}),
});

// --- ExercisePreference ---

export const ExercisePreferenceResponse = Schema.Struct({
	slotKey: ExercisePreference.fields.slotKey,
	exerciseName: ExercisePreference.fields.exerciseName,
});

// --- ExerciseWeight ---

export const ExerciseWeightResponse = Schema.Struct({
	...ExerciseWeight.fields,
	// Date → String for JSON serialization
	updatedAt: Schema.String,
	// Literal → String for JSON serialization
	unit: Schema.String,
});

export const ExerciseWeightInput = Schema.Struct({
	exerciseName: ExerciseWeight.fields.exerciseName,
	weight: ExerciseWeight.fields.weight,
	unit: Schema.String,
	rpe: Schema.NullOr(RpeNumber),
});

// --- Previous Maxes ---

export const PreviousMaxesResponse = UserLifts;

export const NullablePreviousMaxesResponse = Schema.NullOr(
	PreviousMaxesResponse,
);
