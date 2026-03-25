import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiGroup,
	HttpApiSchema,
} from "effect/unstable/httpapi";
import { AuthError, InternalError, NotFoundError } from "../errors/index.js";
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
		error: [
			AuthError.pipe(HttpApiSchema.status(401)),
			NotFoundError.pipe(HttpApiSchema.status(404)),
			InternalError.pipe(HttpApiSchema.status(500)),
		],
	}),
	HttpApiEndpoint.post("logout", "/api/auth/logout", {
		success: LogoutResponse,
	}),
) {}

export class CyclesGroup extends HttpApiGroup.make("cycles")
	.add(
		HttpApiEndpoint.get("current", "/api/cycles/current", {
			success: NullableCycleResponse,
			error: [
				AuthError.pipe(HttpApiSchema.status(401)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
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
			error: [
				AuthError.pipe(HttpApiSchema.status(401)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
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
			error: [
				AuthError.pipe(HttpApiSchema.status(401)),
				NotFoundError.pipe(HttpApiSchema.status(404)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
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
			error: [
				AuthError.pipe(HttpApiSchema.status(401)),
				InternalError.pipe(HttpApiSchema.status(500)),
			],
		}),
	) {}

export class WorkoutsGroup extends HttpApiGroup.make("workouts").add(
	HttpApiEndpoint.get("history", "/api/workouts/history", {
		success: Schema.Array(WorkoutWithSetsResponse),
		error: [
			AuthError.pipe(HttpApiSchema.status(401)),
			InternalError.pipe(HttpApiSchema.status(500)),
		],
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
		error: [
			AuthError.pipe(HttpApiSchema.status(401)),
			InternalError.pipe(HttpApiSchema.status(500)),
		],
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
		error: [
			AuthError.pipe(HttpApiSchema.status(401)),
			NotFoundError.pipe(HttpApiSchema.status(404)),
			InternalError.pipe(HttpApiSchema.status(500)),
		],
	}),
	HttpApiEndpoint.post("complete", "/api/workouts/:id/complete", {
		params: {
			id: Schema.String,
		},
		success: WorkoutResponse,
		error: [
			AuthError.pipe(HttpApiSchema.status(401)),
			NotFoundError.pipe(HttpApiSchema.status(404)),
			InternalError.pipe(HttpApiSchema.status(500)),
		],
	}),
) {}

export class PowerCycleApi extends HttpApi.make("PowerCycleApi")
	.add(HealthGroup)
	.add(AuthGroup)
	.add(CyclesGroup)
	.add(WorkoutsGroup) {}
