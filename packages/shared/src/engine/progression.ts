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
	const lifts: MainLift[] = ["squat", "bench", "deadlift", "ohp"];
	const result = {} as Record<MainLift, ProgressionResult>;
	for (const lift of lifts) {
		const { weight, reps } = round3Results[lift];
		result[lift] = calculateProgression(weight, reps, currentLifts[lift]);
	}
	return result;
};
