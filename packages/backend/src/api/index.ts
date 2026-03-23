import { Schema } from "effect";
import {
	HttpApi,
	HttpApiEndpoint,
	HttpApiGroup,
} from "effect/unstable/httpapi";

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
		success: Schema.Struct({
			success: Schema.Boolean,
			token: Schema.String,
			userId: Schema.String,
		}),
	}),
	HttpApiEndpoint.post("logout", "/api/auth/logout", {
		success: Schema.Struct({
			success: Schema.Boolean,
		}),
	}),
) {}

export class CyclesGroup extends HttpApiGroup.make("cycles").add(
	HttpApiEndpoint.get("current", "/api/cycles/current", {
		success: Schema.Any,
	}),
	HttpApiEndpoint.post("create", "/api/cycles", {
		payload: Schema.Struct({
			squat: Schema.Number,
			bench: Schema.Number,
			deadlift: Schema.Number,
			ohp: Schema.Number,
			unit: Schema.String,
		}),
		success: Schema.Any,
	}),
) {}

export class WorkoutsGroup extends HttpApiGroup.make("workouts").add(
	HttpApiEndpoint.get("next", "/api/workouts/next", {
		success: Schema.Any,
	}),
	HttpApiEndpoint.post("start", "/api/workouts", {
		payload: Schema.Struct({
			cycleId: Schema.String,
			round: Schema.Number,
			day: Schema.Number,
		}),
		success: Schema.Any,
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
		success: Schema.Any,
	}),
	HttpApiEndpoint.post("complete", "/api/workouts/:id/complete", {
		params: {
			id: Schema.String,
		},
		success: Schema.Any,
	}),
) {}

export class PowerCycleApi extends HttpApi.make("PowerCycleApi")
	.add(HealthGroup)
	.add(AuthGroup)
	.add(CyclesGroup)
	.add(WorkoutsGroup) {}
