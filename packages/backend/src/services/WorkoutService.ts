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
			round: number,
			day: number,
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
					round: round as Round,
					day: day as TrainingDay,
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
					category: input.category ?? null,
					setNumber: input.setNumber,
					prescribedWeight: input.prescribedWeight ?? null,
					actualWeight: input.actualWeight ?? null,
					prescribedReps: input.prescribedReps ?? null,
					actualReps: input.actualReps ?? null,
					prescribedRpeMin: input.prescribedRpeMin ?? null,
					prescribedRpeMax: input.prescribedRpeMax ?? null,
					rpe: input.rpe ?? null,
					setDuration: input.setDuration ?? null,
					restDuration: input.restDuration ?? null,
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
