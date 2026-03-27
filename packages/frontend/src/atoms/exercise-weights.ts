import { ApiClient } from "./client";

// ── Query Atoms ──

/**
 * Query atom for all saved exercise weights.
 */
export const exerciseWeightsAtom = ApiClient.query(
	"exerciseWeights",
	"list",
	{},
);

// ── Mutation Atoms ──

/**
 * Upsert (create or update) an exercise weight.
 */
export const upsertExerciseWeightAtom = ApiClient.mutation(
	"exerciseWeights",
	"upsert",
);

/**
 * Delete a saved exercise weight by exercise name.
 */
export const deleteExerciseWeightAtom = ApiClient.mutation(
	"exerciseWeights",
	"remove",
);
