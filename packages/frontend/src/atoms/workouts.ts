import { ApiClient } from "./client";

// ── Query Atoms ──

/**
 * Query atom for workout history.
 */
export const workoutHistoryAtom = ApiClient.query("workouts", "history", {});

/**
 * Query atom for the next scheduled workout.
 */
export const nextWorkoutAtom = ApiClient.query("workouts", "next", {});

/**
 * Query atom for the current in-progress workout (or null).
 */
export const currentWorkoutAtom = ApiClient.query("workouts", "current", {});

// ── Mutation Atoms ──

/**
 * Start a new workout session.
 */
export const startWorkoutAtom = ApiClient.mutation("workouts", "start");

/**
 * Log a set for an in-progress workout.
 * Requires params.id (workout ID) and payload with set data.
 */
export const logSetAtom = ApiClient.mutation("workouts", "logSet");

/**
 * Mark a workout as complete.
 * Requires params.id (workout ID).
 */
export const completeWorkoutAtom = ApiClient.mutation("workouts", "complete");

/**
 * Skip remaining sets for an exercise.
 * Requires params.id (workout ID) and payload with exerciseName + fromSetNumber.
 */
export const skipSetsAtom = ApiClient.mutation("workouts", "skipSets");
