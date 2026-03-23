import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { WorkoutService } from "../services/WorkoutService.js";
import { PowerCycleApi } from "./index.js";

export const WorkoutsLive = HttpApiBuilder.group(
	PowerCycleApi,
	"workouts",
	Effect.fnUntraced(function* (handlers) {
		const workoutService = yield* WorkoutService;
		return handlers
			.handle("next", () =>
				Effect.succeed({ message: "TODO: compute next workout" }),
			)
			.handle("start", (ctx) =>
				workoutService.startWorkout(
					"TODO-user-id",
					ctx.payload.cycleId,
					ctx.payload.round,
					ctx.payload.day,
				),
			)
			.handle("logSet", (ctx) =>
				workoutService.logSet(ctx.params.id, {
					exerciseName: ctx.payload.exerciseName,
					setNumber: ctx.payload.setNumber,
					prescribedWeight: ctx.payload.prescribedWeight ?? undefined,
					actualWeight: ctx.payload.actualWeight ?? undefined,
					prescribedReps: ctx.payload.prescribedReps ?? undefined,
					actualReps: ctx.payload.actualReps ?? undefined,
					rpe: ctx.payload.rpe ?? undefined,
					isMainLift: ctx.payload.isMainLift,
					isAmrap: ctx.payload.isAmrap,
				}),
			)
			.handle("complete", (ctx) =>
				workoutService.completeWorkout(ctx.params.id),
			);
	}),
);
