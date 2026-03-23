import { Schema } from "effect";
import type { MainLift } from "./lifts.js";
import type { Round, TrainingDay } from "./program.js";

export const ExerciseCategory = Schema.Literals([
	"squat_variation",
	"compound_leg",
	"quad",
	"hamstring_glute",
	"calf",
	"bench_variation",
	"chest",
	"tricep",
	"deadlift_variation",
	"vertical_pull",
	"lateral_pull",
	"bicep",
	"delt",
]);
export type ExerciseCategory = typeof ExerciseCategory.Type;

// Exercise options from the PRIME spreadsheet
export const EXERCISE_OPTIONS: Record<ExerciseCategory, readonly string[]> = {
	squat_variation: ["Pause Squat", "Front Squat", "Box Squats"],
	compound_leg: ["Front Squats", "Lunges", "Leg Press", "Hack Squats"],
	quad: ["Leg Extensions"],
	hamstring_glute: ["Leg Curls", "Romanian Deadlifts"],
	calf: ["Calf Raises (Seated)", "Calf Raises (Straight Leg)"],
	bench_variation: [
		"Incline Bench Press",
		"Decline Bench Press",
		"Dumbbell Press",
	],
	chest: [
		"Incline Press (DB/BB/M)",
		"Decline Press (DB/BB/M)",
		"Flat Press (DB/M)",
		"Chest Flies",
	],
	tricep: [
		"Overhead Extension (French)",
		"Frontal Extension (Skullcrusher)",
		"Downward Extension (Pushdown)",
	],
	deadlift_variation: [
		"Romanian Deadlift",
		"Straight Leg Deadlift",
		"Deficit Deadlift",
		"Rack Pull",
		"Sumo Deadlift",
	],
	vertical_pull: ["Pull-Ups", "Pulldowns (M/C)", "Face Pulls"],
	lateral_pull: ["Bent-over Rows (BB/DB)", "Rows (C/M)", "Face Pulls"],
	bicep: [
		"Curls (DB/EZ/C)",
		"Hammer Curls (DB/C)",
		"Preacher Curls",
		"Concentrated Curls",
		"High Side Cable Curls",
	],
	delt: [
		"Front Delt Raise",
		"Side Delt Raise",
		"Rear Delt Raise",
		"Trap Shrugs",
		"Face Pulls",
	],
};

export interface PrescribedSet {
	readonly setNumber: number;
	readonly weight: number;
	readonly reps: number;
	readonly percentage: number;
	readonly isAmrap: boolean;
}

export interface RpeSet {
	readonly setNumber: number;
	readonly rpeMin: number;
	readonly rpeMax: number;
	readonly repMin: number;
	readonly repMax: number;
}

export interface ExerciseSlot {
	readonly category: ExerciseCategory;
	readonly defaultExercise: string;
	readonly sets: readonly RpeSet[];
}

export interface WorkoutPlan {
	readonly day: Exclude<TrainingDay, 5>;
	readonly round: Round;
	readonly cycle: number;
	readonly mainLift: MainLift;
	readonly mainLiftSets: readonly PrescribedSet[];
	readonly variation: ExerciseSlot;
	readonly accessories: readonly ExerciseSlot[];
}
