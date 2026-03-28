import type { MainLift } from "../schema/lifts.js";
import { calculate1RM } from "./calculations.js";

export interface ProgressionResult {
	readonly currentMax: number;
	readonly newMax: number;
	readonly progressed: boolean;
}

export const calculateProgression = (
	weight: number,
	reps: number,
	currentMax: number,
): ProgressionResult => {
	if (reps <= 1) {
		return { currentMax, newMax: currentMax, progressed: false };
	}
	const newMax = calculate1RM(weight, reps);
	return {
		currentMax,
		newMax: Math.max(newMax, currentMax), // never decrease
		progressed: newMax > currentMax,
	};
};

export type CycleProgressionResult = Record<MainLift, ProgressionResult>;

export const calculateCycleProgression = (
	round3Results: Record<MainLift, { weight: number; reps: number }>,
	currentLifts: Record<MainLift, number>,
): CycleProgressionResult => {
	return {
		squat: calculateProgression(
			round3Results.squat.weight,
			round3Results.squat.reps,
			currentLifts.squat,
		),
		bench: calculateProgression(
			round3Results.bench.weight,
			round3Results.bench.reps,
			currentLifts.bench,
		),
		deadlift: calculateProgression(
			round3Results.deadlift.weight,
			round3Results.deadlift.reps,
			currentLifts.deadlift,
		),
		ohp: calculateProgression(
			round3Results.ohp.weight,
			round3Results.ohp.reps,
			currentLifts.ohp,
		),
	};
};
