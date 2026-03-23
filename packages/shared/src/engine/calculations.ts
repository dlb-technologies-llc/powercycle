import { PLATE_INCREMENT, type Unit } from "../schema/lifts.js";

export const roundToNearest = (weight: number, increment = 5): number => {
	return Math.round(weight / increment) * increment;
};

export const calculateWeight = (
	oneRepMax: number,
	percentage: number,
	unit: Unit,
): number => {
	return roundToNearest(oneRepMax * percentage, PLATE_INCREMENT[unit]);
};

// Epley formula: weight * (1 + reps / 30)
export const calculate1RM = (weight: number, reps: number): number => {
	if (reps <= 1) return roundToNearest(weight);
	return roundToNearest(weight * (1 + reps / 30));
};
