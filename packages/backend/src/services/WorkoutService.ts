import { NotFoundError } from "@powercycle/shared/errors/index";
import { Effect, Layer, ServiceMap } from "effect";

export interface WorkoutData {
	id: string;
	userId: string;
	cycleId: string;
	round: number;
	day: number;
	startedAt: Date;
	completedAt: Date | null;
}

export interface SetData {
	id: string;
	workoutId: string;
	exerciseName: string;
	category: string | null;
	setNumber: number;
	prescribedWeight: number | null;
	actualWeight: number | null;
	prescribedReps: number | null;
	actualReps: number | null;
	prescribedRpeMin: number | null;
	prescribedRpeMax: number | null;
	rpe: number | null;
	isMainLift: boolean;
	isAmrap: boolean;
	completedAt: Date | null;
}

export interface LogSetInput {
	exerciseName: string;
	category?: string;
	setNumber: number;
	prescribedWeight?: number;
	actualWeight?: number;
	prescribedReps?: number;
	actualReps?: number;
	prescribedRpeMin?: number;
	prescribedRpeMax?: number;
	rpe?: number;
	isMainLift: boolean;
	isAmrap: boolean;
}

export class WorkoutService extends ServiceMap.Service<
	WorkoutService,
	{
		readonly createEntity: (
			userId: string,
			cycleId: string,
			round: number,
			day: number,
		) => Effect.Effect<WorkoutData>;
		readonly createSetEntity: (
			workoutId: string,
			input: LogSetInput,
		) => Effect.Effect<SetData>;
		readonly validateWorkout: (
			workout: WorkoutData | null,
			workoutId: string,
		) => Effect.Effect<WorkoutData, NotFoundError>;
	}
>()("@powercycle/WorkoutService") {}

export const WorkoutLive = Layer.succeed(WorkoutService)({
	createEntity: (userId, cycleId, round, day) =>
		Effect.sync(() => ({
			id: crypto.randomUUID(),
			userId,
			cycleId,
			round,
			day,
			startedAt: new Date(),
			completedAt: null,
		})),

	createSetEntity: (workoutId, input) =>
		Effect.sync(() => ({
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
			isMainLift: input.isMainLift,
			isAmrap: input.isAmrap,
			completedAt: new Date(),
		})),

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
