import { RestDayError } from "../errors/index.js";
import type { Unit, UserLifts } from "../schema/lifts.js";
import {
	DAY_LIFT_MAP,
	ROUND_CONFIGS,
	type Round,
	type TrainingDay,
} from "../schema/program.js";
import {
	EXERCISE_OPTIONS,
	type ExerciseCategory,
	type ExerciseSlot,
	type PrescribedSet,
	type RpeSet,
	type WorkoutPlan,
} from "../schema/workout.js";
import { calculateWeight } from "./calculations.js";

export const generateMainLiftSets = (
	oneRepMax: number,
	round: Round,
	unit: Unit,
): readonly PrescribedSet[] => {
	const config = ROUND_CONFIGS[round];
	return config.map((set, i) => ({
		setNumber: i + 1,
		weight: calculateWeight(oneRepMax, set.percentage, unit),
		reps: set.reps,
		percentage: set.percentage,
		isAmrap: set.isAmrap,
	}));
};

const standardVariationSets = (): readonly RpeSet[] =>
	Array.from({ length: 6 }, (_, i) => ({
		setNumber: i + 1,
		rpeMin: 5,
		rpeMax: i < 5 ? 7 : 8,
		repMin: 6,
		repMax: 10,
	}));

const standardAccessorySets = (
	repMin: number,
	repMax: number,
): readonly RpeSet[] => {
	const rpeProgression: readonly [number, number][] = [
		[5, 6],
		[6, 7],
		[7, 8],
		[7, 9],
		[7, 10],
		[7, 10],
	];
	return rpeProgression.map(([min, max], i) => ({
		setNumber: i + 1,
		rpeMin: min,
		rpeMax: max,
		repMin,
		repMax,
	}));
};

const deltAccessorySets = (): readonly RpeSet[] => {
	const rpeProgression: readonly [number, number][] = [
		[5, 7],
		[6, 7],
		[6, 8],
		[7, 8],
		[7, 9],
		[7, 9],
	];
	return rpeProgression.map(([min, max], i) => ({
		setNumber: i + 1,
		rpeMin: min,
		rpeMax: max,
		repMin: 10,
		repMax: 15,
	}));
};

const day4ArmSets = (): readonly RpeSet[] => {
	const rpeProgression: readonly [number, number][] = [
		[5, 7],
		[5, 7],
		[5, 7],
		[6, 8],
		[6, 10],
		[6, 10],
	];
	return rpeProgression.map(([min, max], i) => ({
		setNumber: i + 1,
		rpeMin: min,
		rpeMax: max,
		repMin: 8,
		repMax: 15,
	}));
};

const VARIATION_MAP: Record<
	Exclude<TrainingDay, 5>,
	ExerciseCategory | null
> = {
	1: "squat_variation",
	2: "bench_variation",
	3: "deadlift_variation",
	4: null, // OHP has no variation
};

export const getVariationSlot = (
	day: Exclude<TrainingDay, 5>,
): ExerciseSlot | null => {
	const category = VARIATION_MAP[day];
	if (category === null) return null;
	return {
		category,
		defaultExercise: EXERCISE_OPTIONS[category][0],
		sets: standardVariationSets(),
	};
};

export const getAccessorySlots = (
	day: Exclude<TrainingDay, 5>,
): readonly ExerciseSlot[] => {
	switch (day) {
		case 1: // Legs
			return [
				{
					category: "compound_leg",
					defaultExercise: EXERCISE_OPTIONS.compound_leg[0],
					sets: standardAccessorySets(8, 12),
				},
				{
					category: "quad",
					defaultExercise: EXERCISE_OPTIONS.quad[0],
					sets: standardAccessorySets(10, 15),
				},
				{
					category: "hamstring_glute",
					defaultExercise: EXERCISE_OPTIONS.hamstring_glute[0],
					sets: standardAccessorySets(10, 15),
				},
				{
					category: "calf",
					defaultExercise: EXERCISE_OPTIONS.calf[0],
					sets: standardAccessorySets(10, 15),
				},
			];
		case 2: // Push
			return [
				{
					category: "chest",
					defaultExercise: EXERCISE_OPTIONS.chest[0],
					sets: standardAccessorySets(8, 12),
				},
				{
					category: "chest",
					defaultExercise: EXERCISE_OPTIONS.chest[3],
					sets: standardAccessorySets(10, 15),
				},
				{
					category: "tricep",
					defaultExercise: EXERCISE_OPTIONS.tricep[0],
					sets: standardAccessorySets(10, 15),
				},
				{
					category: "tricep",
					defaultExercise: EXERCISE_OPTIONS.tricep[2],
					sets: standardAccessorySets(10, 15),
				},
			];
		case 3: // Pull
			return [
				{
					category: "vertical_pull",
					defaultExercise: EXERCISE_OPTIONS.vertical_pull[0],
					sets: standardAccessorySets(8, 15),
				},
				{
					category: "lateral_pull",
					defaultExercise: EXERCISE_OPTIONS.lateral_pull[0],
					sets: standardAccessorySets(8, 15),
				},
				{
					category: "bicep",
					defaultExercise: EXERCISE_OPTIONS.bicep[0],
					sets: standardAccessorySets(10, 15),
				},
				{
					category: "bicep",
					defaultExercise: EXERCISE_OPTIONS.bicep[4],
					sets: standardAccessorySets(10, 15),
				},
			];
		case 4: // Shoulders (OHP) — first 3 are delt accessories, then bicep + tricep
			return [
				{
					category: "delt",
					defaultExercise: EXERCISE_OPTIONS.delt[0],
					sets: deltAccessorySets(),
				},
				{
					category: "delt",
					defaultExercise: EXERCISE_OPTIONS.delt[1],
					sets: deltAccessorySets(),
				},
				{
					category: "delt",
					defaultExercise: EXERCISE_OPTIONS.delt[2],
					sets: deltAccessorySets(),
				},
				{
					category: "bicep",
					defaultExercise: EXERCISE_OPTIONS.bicep[2],
					sets: day4ArmSets(),
				},
				{
					category: "tricep",
					defaultExercise: EXERCISE_OPTIONS.tricep[0],
					sets: day4ArmSets(),
				},
			];
	}
};

export const generateWorkoutPlan = (
	lifts: UserLifts,
	cycle: number,
	round: Round,
	day: TrainingDay,
): WorkoutPlan => {
	if (day === 5) {
		throw new RestDayError({ day: 5 });
	}

	const mainLift = DAY_LIFT_MAP[day];
	const oneRepMax = lifts[mainLift];

	const mainLiftSets = generateMainLiftSets(oneRepMax, round, lifts.unit);
	const variation = getVariationSlot(day);
	const accessories = getAccessorySlots(day);

	return {
		day,
		round,
		cycle,
		mainLift,
		mainLiftSets,
		variation: variation ?? accessories[0], // Day 4: first delt IS the "variation"
		accessories: variation ? accessories : accessories.slice(1), // Day 4: remaining are accessories
	};
};
