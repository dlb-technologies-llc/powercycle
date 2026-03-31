import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiGroup,
	HttpApiSchema,
} from "effect/unstable/httpapi";
import { InternalError, NotFoundError } from "../errors/index.js";
import {
	CycleResponse,
	ExercisePreferenceResponse,
	ExerciseWeightInput,
	ExerciseWeightResponse,
	NullableCycleResponse,
	ProgressionResponse,
	RpeNumber,
	SetResponse,
	WorkoutPlanResponse,
	WorkoutResponse,
	WorkoutWithSetsResponse,
} from "../schema/api.js";
import { MainLift, Unit } from "../schema/lifts.js";
import { Round, TrainingDay } from "../schema/program.js";

export class HealthGroup extends HttpApiGroup.make("health").add(
	HttpApiEndpoint.get("check", "/api/health", {
		success: Schema.Struct({
			status: Schema.String,
		}),
	}),
) {}

export class CyclesGroup extends HttpApiGroup.make("cycles")
	.add(
		HttpApiEndpoint.get("current", "/api/v1/cycles/current", {
			success: NullableCycleResponse,
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.post("create", "/api/v1/cycles", {
			payload: Schema.Struct({
				squat: Schema.NullOr(Schema.Number),
				bench: Schema.NullOr(Schema.Number),
				deadlift: Schema.NullOr(Schema.Number),
				ohp: Schema.NullOr(Schema.Number),
				unit: Unit,
			}),
			success: CycleResponse,
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.post("progress", "/api/v1/cycles/progress", {
			payload: Schema.Struct({
				squat: Schema.Struct({
					weight: Schema.Number,
					reps: Schema.Number,
				}),
				bench: Schema.Struct({
					weight: Schema.Number,
					reps: Schema.Number,
				}),
				deadlift: Schema.Struct({
					weight: Schema.Number,
					reps: Schema.Number,
				}),
				ohp: Schema.Struct({
					weight: Schema.Number,
					reps: Schema.Number,
				}),
			}),
			success: ProgressionResponse,
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.post("next", "/api/v1/cycles/next", {
			payload: Schema.Struct({
				squat: Schema.NullOr(Schema.Number),
				bench: Schema.NullOr(Schema.Number),
				deadlift: Schema.NullOr(Schema.Number),
				ohp: Schema.NullOr(Schema.Number),
				unit: Unit,
			}),
			success: CycleResponse,
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.patch("update1rm", "/api/v1/cycles/current/1rm", {
			payload: Schema.Struct({
				lift: MainLift,
				value: Schema.Number,
			}),
			success: CycleResponse,
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.post("end", "/api/v1/cycles/current/end", {
			success: CycleResponse,
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	) {}

export class WorkoutsGroup extends HttpApiGroup.make("workouts")
	.add(
		HttpApiEndpoint.get("history", "/api/v1/workouts/history", {
			success: Schema.Array(WorkoutWithSetsResponse),
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.get("next", "/api/v1/workouts/next", {
			success: Schema.NullOr(WorkoutPlanResponse),
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.get("current", "/api/v1/workouts/current", {
			success: Schema.NullOr(WorkoutResponse),
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.post("start", "/api/v1/workouts", {
			payload: Schema.Struct({
				cycleId: Schema.String,
				round: Round,
				day: TrainingDay,
			}),
			success: WorkoutResponse,
			error: [InternalError.pipe(HttpApiSchema.status(500))],
		}),
	)
	.add(
		HttpApiEndpoint.post("logSet", "/api/v1/workouts/:id/sets", {
			params: {
				id: Schema.String,
			},
			payload: Schema.Struct({
				exerciseName: Schema.String,
				setNumber: Schema.Number,
				prescribedWeight: Schema.NullOr(Schema.Number),
				actualWeight: Schema.NullOr(Schema.Number),
				prescribedReps: Schema.NullOr(Schema.Number),
				actualReps: Schema.NullOr(Schema.Number),
				rpe: Schema.NullOr(RpeNumber),
				prescribedRpeMin: Schema.NullOr(RpeNumber),
				prescribedRpeMax: Schema.NullOr(RpeNumber),
				isMainLift: Schema.Boolean,
				isAmrap: Schema.Boolean,
				setDuration: Schema.NullOr(Schema.Number),
				restDuration: Schema.NullOr(Schema.Number),
				category: Schema.NullOr(Schema.String),
			}),
			success: SetResponse,
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.post("complete", "/api/v1/workouts/:id/complete", {
			params: {
				id: Schema.String,
			},
			success: WorkoutResponse,
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.get("sets", "/api/v1/workouts/:id/sets", {
			params: {
				id: Schema.String,
			},
			success: Schema.Array(SetResponse),
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	)
	.add(
		HttpApiEndpoint.post("skipSets", "/api/v1/workouts/:id/skip-sets", {
			params: {
				id: Schema.String,
			},
			payload: Schema.Struct({
				exerciseName: Schema.String,
				fromSetNumber: Schema.Number,
			}),
			success: Schema.Array(SetResponse),
			error: [
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	) {}

export class PreferencesGroup extends HttpApiGroup.make("preferences").add(
	HttpApiEndpoint.get("getExercises", "/api/v1/preferences/exercises", {
		success: Schema.Array(ExercisePreferenceResponse),
		error: [InternalError.pipe(HttpApiSchema.status(500))],
	}),
	HttpApiEndpoint.post("setExercise", "/api/v1/preferences/exercises", {
		payload: Schema.Struct({
			slotKey: Schema.String,
			exerciseName: Schema.String,
		}),
		success: ExercisePreferenceResponse,
		error: [InternalError.pipe(HttpApiSchema.status(500))],
	}),
) {}

export class ExerciseWeightsGroup extends HttpApiGroup.make(
	"exerciseWeights",
).add(
	HttpApiEndpoint.get("list", "/api/v1/exercise-weights", {
		success: Schema.Array(ExerciseWeightResponse),
		error: [InternalError.pipe(HttpApiSchema.status(500))],
	}),
	HttpApiEndpoint.put("upsert", "/api/v1/exercise-weights", {
		payload: ExerciseWeightInput,
		success: ExerciseWeightResponse,
		error: [InternalError.pipe(HttpApiSchema.status(500))],
	}),
	HttpApiEndpoint.delete("remove", "/api/v1/exercise-weights/:exerciseName", {
		params: { exerciseName: Schema.String },
		success: Schema.Struct({ deleted: Schema.Boolean }),
		error: [InternalError.pipe(HttpApiSchema.status(500))],
	}),
) {}

export class PowerCycleApi extends HttpApi.make("PowerCycleApi")
	.add(HealthGroup)
	.add(CyclesGroup)
	.add(WorkoutsGroup)
	.add(PreferencesGroup)
	.add(ExerciseWeightsGroup) {}
