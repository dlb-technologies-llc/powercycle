import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiGroup,
} from "effect/unstable/httpapi";
import {
	CycleResponse,
	LoginResponse,
	LogoutResponse,
	NullableCycleResponse,
	ProgressionResponse,
	SetResponse,
	WorkoutResponse,
	WorkoutWithSetsResponse,
} from "../schema/api.js";

export class HealthGroup extends HttpApiGroup.make("health").add(
	HttpApiEndpoint.get("check", "/api/health", {
		success: Schema.Struct({
			status: Schema.String,
		}),
	}),
) {}

export class AuthGroup extends HttpApiGroup.make("auth").add(
	HttpApiEndpoint.post("login", "/api/auth/login", {
		payload: Schema.Struct({
			username: Schema.String,
			password: Schema.String,
		}),
		success: LoginResponse,
	}),
	HttpApiEndpoint.post("logout", "/api/auth/logout", {
		success: LogoutResponse,
	}),
) {}

export class CyclesGroup extends HttpApiGroup.make("cycles")
	.add(
		HttpApiEndpoint.get("current", "/api/cycles/current", {
			success: NullableCycleResponse,
		}),
	)
	.add(
		HttpApiEndpoint.post("create", "/api/cycles", {
			payload: Schema.Struct({
				squat: Schema.Number,
				bench: Schema.Number,
				deadlift: Schema.Number,
				ohp: Schema.Number,
				unit: Schema.String,
			}),
			success: CycleResponse,
		}),
	)
	.add(
		HttpApiEndpoint.post("progress", "/api/cycles/progress", {
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
		}),
	)
	.add(
		HttpApiEndpoint.post("next", "/api/cycles/next", {
			payload: Schema.Struct({
				squat: Schema.Number,
				bench: Schema.Number,
				deadlift: Schema.Number,
				ohp: Schema.Number,
				unit: Schema.String,
			}),
			success: CycleResponse,
		}),
	) {}

export class WorkoutsGroup extends HttpApiGroup.make("workouts").add(
	HttpApiEndpoint.get("history", "/api/workouts/history", {
		success: Schema.Array(WorkoutWithSetsResponse),
	}),
	HttpApiEndpoint.get("next", "/api/workouts/next", {
		success: Schema.Any,
	}),
	HttpApiEndpoint.post("start", "/api/workouts", {
		payload: Schema.Struct({
			cycleId: Schema.String,
			round: Schema.Number,
			day: Schema.Number,
		}),
		success: WorkoutResponse,
	}),
	HttpApiEndpoint.post("logSet", "/api/workouts/:id/sets", {
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
			rpe: Schema.NullOr(Schema.Number),
			isMainLift: Schema.Boolean,
			isAmrap: Schema.Boolean,
		}),
		success: SetResponse,
	}),
	HttpApiEndpoint.post("complete", "/api/workouts/:id/complete", {
		params: {
			id: Schema.String,
		},
		success: WorkoutResponse,
	}),
) {}

export class PowerCycleApi extends HttpApi.make("PowerCycleApi")
	.add(HealthGroup)
	.add(AuthGroup)
	.add(CyclesGroup)
	.add(WorkoutsGroup) {}
