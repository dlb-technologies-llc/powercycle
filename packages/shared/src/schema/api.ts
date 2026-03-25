import { Schema } from "effect";

export const LoginResponse = Schema.Struct({
	success: Schema.Boolean,
	token: Schema.String,
	userId: Schema.String,
});

export const LogoutResponse = Schema.Struct({
	success: Schema.Boolean,
});

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
