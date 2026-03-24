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
		readonly startWorkout: (
			userId: string,
			cycleId: string,
			round: number,
			day: number,
		) => Effect.Effect<WorkoutData>;
		readonly logSet: (
			workoutId: string,
			setData: LogSetInput,
		) => Effect.Effect<SetData>;
		readonly completeWorkout: (workoutId: string) => Effect.Effect<WorkoutData>;
		readonly getWorkout: (
			workoutId: string,
		) => Effect.Effect<(WorkoutData & { sets: Array<SetData> }) | null>;
		readonly getHistory: (
			userId: string,
		) => Effect.Effect<Array<WorkoutData & { sets: Array<SetData> }>>;
	}
>()("WorkoutService") {
	static test = Layer.sync(this, () => {
		const workouts: Array<WorkoutData> = [];
		const sets: Array<SetData> = [];

		return {
			startWorkout: (
				userId: string,
				cycleId: string,
				round: number,
				day: number,
			) =>
				Effect.sync(() => {
					const workout: WorkoutData = {
						id: crypto.randomUUID(),
						userId,
						cycleId,
						round,
						day,
						startedAt: new Date(),
						completedAt: null,
					};
					workouts.push(workout);
					return workout;
				}),

			logSet: (workoutId: string, setData: LogSetInput) =>
				Effect.sync(() => {
					const set: SetData = {
						id: crypto.randomUUID(),
						workoutId,
						exerciseName: setData.exerciseName,
						category: setData.category ?? null,
						setNumber: setData.setNumber,
						prescribedWeight: setData.prescribedWeight ?? null,
						actualWeight: setData.actualWeight ?? null,
						prescribedReps: setData.prescribedReps ?? null,
						actualReps: setData.actualReps ?? null,
						prescribedRpeMin: setData.prescribedRpeMin ?? null,
						prescribedRpeMax: setData.prescribedRpeMax ?? null,
						rpe: setData.rpe ?? null,
						isMainLift: setData.isMainLift,
						isAmrap: setData.isAmrap,
						completedAt: new Date(),
					};
					sets.push(set);
					return set;
				}),

			completeWorkout: (workoutId: string) =>
				Effect.sync(() => {
					const workout = workouts.find((w) => w.id === workoutId);
					if (!workout) {
						throw new Error(`Workout not found: ${workoutId}`);
					}
					workout.completedAt = new Date();
					return workout;
				}),

			getWorkout: (workoutId: string) =>
				Effect.sync(() => {
					const workout = workouts.find((w) => w.id === workoutId);
					if (!workout) {
						return null;
					}
					const workoutSets = sets.filter((s) => s.workoutId === workoutId);
					return { ...workout, sets: workoutSets };
				}),

			getHistory: (userId: string) =>
				Effect.sync(() =>
					workouts
						.filter((w) => w.userId === userId && w.completedAt !== null)
						.map((w) => ({
							...w,
							sets: sets.filter((s) => s.workoutId === w.id),
						}))
						.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
				),
		};
	});
}
