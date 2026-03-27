import { Schema } from "effect";
import { MainLift } from "./lifts.js";
import { Round, TrainingDay } from "./program.js";

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

export const PrescribedSet = Schema.Struct({
	setNumber: Schema.Number,
	weight: Schema.Number,
	reps: Schema.Number,
	percentage: Schema.Number,
	isAmrap: Schema.Boolean,
});
export type PrescribedSet = typeof PrescribedSet.Type;

export const RpeSet = Schema.Struct({
	setNumber: Schema.Number,
	rpeMin: Schema.Number,
	rpeMax: Schema.Number,
	repMin: Schema.Number,
	repMax: Schema.Number,
});
export type RpeSet = typeof RpeSet.Type;

export const ExerciseSlot = Schema.Struct({
	category: ExerciseCategory,
	defaultExercise: Schema.String,
	sets: Schema.Array(RpeSet),
});
export type ExerciseSlot = typeof ExerciseSlot.Type;

export const WorkoutPlan = Schema.Struct({
	day: TrainingDay,
	round: Round,
	cycle: Schema.Number,
	mainLift: MainLift,
	mainLiftSets: Schema.Array(PrescribedSet),
	variation: ExerciseSlot,
	accessories: Schema.Array(ExerciseSlot),
});
export type WorkoutPlan = typeof WorkoutPlan.Type;
