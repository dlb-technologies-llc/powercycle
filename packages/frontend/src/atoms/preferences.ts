import { ApiClient } from "./client";

// ── Query Atoms ──

/**
 * Query atom for exercise preferences.
 */
export const exercisePreferencesAtom = ApiClient.query(
	"preferences",
	"getExercises",
	{},
);

// ── Mutation Atoms ──

/**
 * Set an exercise preference for a slot.
 */
export const setExercisePreferenceAtom = ApiClient.mutation(
	"preferences",
	"setExercise",
);
