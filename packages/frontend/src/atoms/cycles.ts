import { ApiClient } from "./client";

// ── Query Atoms ──

/**
 * Query atom for the current active cycle.
 * Automatically fetches on mount and re-fetches on reactivity key changes.
 */
export const currentCycleAtom = ApiClient.query("cycles", "current", {});

// ── Mutation Atoms ──

/**
 * Create a new training cycle with initial training maxes.
 */
export const createCycleAtom = ApiClient.mutation("cycles", "create");

/**
 * Calculate progression based on AMRAP set results.
 */
export const calculateProgressionAtom = ApiClient.mutation(
	"cycles",
	"progress",
);

/**
 * Start the next training cycle with updated maxes.
 */
export const startNextCycleAtom = ApiClient.mutation("cycles", "next");
