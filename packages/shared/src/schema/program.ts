import { Schema } from "effect";
import type { MainLift } from "./lifts.js";

export const Round = Schema.Literals([1, 2, 3, 4]);
export type Round = typeof Round.Type;

export const TrainingDay = Schema.Literals([1, 2, 3, 4]);
export type TrainingDay = typeof TrainingDay.Type;

export const DAY_LIFT_MAP = {
	1: "squat",
	2: "bench",
	3: "deadlift",
	4: "ohp",
} as const satisfies Record<TrainingDay, MainLift>;

export interface SetConfig {
	readonly percentage: number;
	readonly reps: number;
	readonly isAmrap: boolean;
}

// The exact set configurations from the PRIME Powerbuilding spreadsheet
export const ROUND_CONFIGS: Record<Round, readonly SetConfig[]> = {
	1: [
		{ percentage: 0.45, reps: 10, isAmrap: false },
		{ percentage: 0.55, reps: 5, isAmrap: false },
		{ percentage: 0.65, reps: 5, isAmrap: false },
		{ percentage: 0.75, reps: 5, isAmrap: false },
		{ percentage: 0.85, reps: 5, isAmrap: true },
		{ percentage: 0.85, reps: 5, isAmrap: true },
	],
	2: [
		{ percentage: 0.5, reps: 8, isAmrap: false },
		{ percentage: 0.6, reps: 3, isAmrap: false },
		{ percentage: 0.7, reps: 3, isAmrap: false },
		{ percentage: 0.8, reps: 3, isAmrap: false },
		{ percentage: 0.9, reps: 3, isAmrap: true },
		{ percentage: 0.9, reps: 3, isAmrap: true },
	],
	3: [
		{ percentage: 0.5, reps: 10, isAmrap: false },
		{ percentage: 0.7, reps: 5, isAmrap: false },
		{ percentage: 0.8, reps: 3, isAmrap: false },
		{ percentage: 0.85, reps: 2, isAmrap: false },
		{ percentage: 0.9, reps: 1, isAmrap: false },
		{ percentage: 0.95, reps: 1, isAmrap: true },
	],
	4: [
		{ percentage: 0.5, reps: 10, isAmrap: false },
		{ percentage: 0.6, reps: 8, isAmrap: false },
		{ percentage: 0.7, reps: 5, isAmrap: false },
		{ percentage: 0.7, reps: 5, isAmrap: false },
		{ percentage: 0.7, reps: 5, isAmrap: false },
		{ percentage: 0.7, reps: 5, isAmrap: false },
	],
};
