import { estimateWeight } from "@powercycle/shared/engine/weight-estimates";
import {
	type InternalError,
	NotFoundError,
} from "@powercycle/shared/errors/index";
import type {
	LastSession,
	WorkoutPlanResponseType,
} from "@powercycle/shared/schema/api";
import { ExerciseWeight } from "@powercycle/shared/schema/entities/exercise-weight";
import { Workout } from "@powercycle/shared/schema/entities/workout";
import {
	type LogSetInput,
	WorkoutSet,
} from "@powercycle/shared/schema/entities/workout-set";
import type { UserLifts } from "@powercycle/shared/schema/lifts";
import type { Round, TrainingDay } from "@powercycle/shared/schema/program";
import type {
	ExerciseSlot,
	WorkoutPlan,
} from "@powercycle/shared/schema/workout";
import { Effect, Layer, ServiceMap } from "effect";

type AugmentedPlan = WorkoutPlanResponseType;

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
		readonly augmentPlanWithWeights: (
			exerciseWeightRows: ReadonlyArray<unknown>,
			lastSessionRows: ReadonlyArray<unknown>,
			plan: WorkoutPlan,
			lifts: UserLifts,
		) => Effect.Effect<AugmentedPlan, InternalError>;
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
					skipped: false,
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

	augmentPlanWithWeights: (exerciseWeightRows, lastSessionRows, plan, lifts) =>
		Effect.gen(function* () {
			// Decode exercise weights and build lookup
			const exerciseWeights = yield* Effect.forEach(exerciseWeightRows, (r) =>
				ExerciseWeight.decodeRow(r),
			);
			const weightMap = new Map(
				exerciseWeights.map((ew) => [ew.exerciseName, ew.weight]),
			);

			// Decode last session data and build lookup
			const lastSessionMap = new Map<string, LastSession>();
			for (const raw of lastSessionRows) {
				const decoded = yield* WorkoutSet.decodeLastSessionRow(raw);
				if (!lastSessionMap.has(decoded.exerciseName)) {
					lastSessionMap.set(decoded.exerciseName, {
						weight: decoded.actualWeight,
						reps: decoded.actualReps,
						rpe: decoded.rpe,
					});
				}
			}

			const enrichSlot = (slot: ExerciseSlot) => ({
				...slot,
				preferredWeight: weightMap.get(slot.defaultExercise) ?? null,
				suggestedWeight: estimateWeight(slot.category, lifts),
				lastSession: lastSessionMap.get(slot.defaultExercise) ?? null,
			});

			return {
				...plan,
				variation: enrichSlot(plan.variation),
				accessories: plan.accessories.map(enrichSlot),
			};
		}),
});

export const WorkoutTest = WorkoutLive;
