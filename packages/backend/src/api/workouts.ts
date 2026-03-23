import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { AuthService } from "../services/AuthService.js";
import { WorkoutService } from "../services/WorkoutService.js";
import { PowerCycleApi } from "./index.js";
import { getUserId } from "./middleware.js";

export const WorkoutsLive = HttpApiBuilder.group(
	PowerCycleApi,
	"workouts",
	Effect.fnUntraced(function* (handlers) {
		const workoutService = yield* WorkoutService;
		const authService = yield* AuthService;
		return handlers
			.handle("next", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					return { message: "TODO: compute next workout", userId };
				}),
			)
			.handle("start", (ctx) =>
				Effect.gen(function* () {
					const userId = yield* getUserId(
						ctx.request.headers.authorization,
						authService,
					);
					return yield* workoutService.startWorkout(
						userId,
						ctx.payload.cycleId,
						ctx.payload.round,
						ctx.payload.day,
					);
				}),
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
