import { Schema } from "effect";
import { MainLift } from "./lifts.js";

export const CycleResponse = Schema.Struct({
	id: Schema.String,
	userId: Schema.String,
	cycleNumber: Schema.Number,
	squat1rm: Schema.Number,
	bench1rm: Schema.Number,
	deadlift1rm: Schema.Number,
	ohp1rm: Schema.Number,
	unit: Schema.String,
	currentRound: Schema.Number,
	currentDay: Schema.Number,
	startedAt: Schema.String,
	completedAt: Schema.NullOr(Schema.String),
});

export const NullableCycleResponse = Schema.NullOr(CycleResponse);

export const SetResponse = Schema.Struct({
	id: Schema.String,
	workoutId: Schema.String,
	exerciseName: Schema.String,
	category: Schema.NullOr(Schema.String),
	setNumber: Schema.Number,
	prescribedWeight: Schema.NullOr(Schema.Number),
	actualWeight: Schema.NullOr(Schema.Number),
	prescribedReps: Schema.NullOr(Schema.Number),
	actualReps: Schema.NullOr(Schema.Number),
	prescribedRpeMin: Schema.NullOr(Schema.Number),
	prescribedRpeMax: Schema.NullOr(Schema.Number),
	rpe: Schema.NullOr(Schema.Number),
	isMainLift: Schema.Boolean,
	isAmrap: Schema.Boolean,
	setDuration: Schema.NullOr(Schema.Number),
	restDuration: Schema.NullOr(Schema.Number),
	completedAt: Schema.NullOr(Schema.String),
});

export const WorkoutResponse = Schema.Struct({
	id: Schema.String,
	userId: Schema.String,
	cycleId: Schema.String,
	round: Schema.Number,
	day: Schema.Number,
	startedAt: Schema.String,
	completedAt: Schema.NullOr(Schema.String),
});

export const WorkoutWithSetsResponse = Schema.Struct({
	...WorkoutResponse.fields,
	sets: Schema.Array(SetResponse),
});

export const PrescribedSetSchema = Schema.Struct({
	setNumber: Schema.Number,
	weight: Schema.Number,
	reps: Schema.Number,
	percentage: Schema.Number,
	isAmrap: Schema.Boolean,
});

export const RpeSetSchema = Schema.Struct({
	setNumber: Schema.Number,
	rpeMin: Schema.Number,
	rpeMax: Schema.Number,
	repMin: Schema.Number,
	repMax: Schema.Number,
});

export const ExerciseSlotSchema = Schema.Struct({
	category: Schema.String,
	defaultExercise: Schema.String,
	sets: Schema.Array(RpeSetSchema),
});

export const WorkoutPlanResponse = Schema.Struct({
	day: Schema.Number,
	round: Schema.Number,
	cycle: Schema.Number,
	mainLift: MainLift,
	mainLiftSets: Schema.Array(PrescribedSetSchema),
	variation: ExerciseSlotSchema,
	accessories: Schema.Array(ExerciseSlotSchema),
});

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
