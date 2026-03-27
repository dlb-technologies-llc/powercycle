import { NotFoundError } from "@powercycle/shared/errors/index";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import {
	type LogSetInput,
	WorkoutSet,
} from "@powercycle/shared/schema/entities/workout-set";
import type { Round, TrainingDay } from "@powercycle/shared/schema/program";
import { Effect, Layer, ServiceMap } from "effect";

export class WorkoutService extends ServiceMap.Service<
	WorkoutService,
	{
		readonly createEntity: (
			userId: string,
			cycleId: string,
			round: Round,
			day: TrainingDay,
		) => Effect.Effect<Workout>;
		readonly createSetEntity: (
			workoutId: string,
			input: LogSetInput,
		) => Effect.Effect<WorkoutSet>;
		readonly validateWorkout: (
			workout: Workout | null,
			workoutId: string,
		) => Effect.Effect<Workout, NotFoundError>;
	}
>()("@powercycle/WorkoutService") {}

export const WorkoutLive = Layer.succeed(WorkoutService)({
	createEntity: (userId, cycleId, round, day) =>
		Effect.sync(
			() =>
				new Workout({
					id: crypto.randomUUID(),
					userId,
					cycleId,
					round,
					day,
					startedAt: new Date(),
					completedAt: null,
				}),
		),

	createSetEntity: (workoutId, input) =>
		Effect.sync(
			() =>
				new WorkoutSet({
					id: crypto.randomUUID(),
					workoutId,
					exerciseName: input.exerciseName,
					category: input.category,
					setNumber: input.setNumber,
					prescribedWeight: input.prescribedWeight,
					actualWeight: input.actualWeight,
					prescribedReps: input.prescribedReps,
					actualReps: input.actualReps,
					prescribedRpeMin: input.prescribedRpeMin,
					prescribedRpeMax: input.prescribedRpeMax,
					rpe: input.rpe,
					setDuration: input.setDuration,
					restDuration: input.restDuration,
					isMainLift: input.isMainLift,
					isAmrap: input.isAmrap,
					completedAt: new Date(),
				}),
		),

	validateWorkout: (workout, workoutId) =>
		workout
			? Effect.succeed(workout)
			: Effect.fail(
					new NotFoundError({
						message: `Workout not found: ${workoutId}`,
						resource: "workout",
					}),
				),
});

export const WorkoutTest = WorkoutLive;
