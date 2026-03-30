import type { MainLift, UserLifts } from "../schema/lifts.js";
import type { ExerciseCategory } from "../schema/workout.js";
import { calculateWeight } from "./calculations.js";

export const CATEGORY_LIFT_MAP: Record<
	ExerciseCategory,
	{ lift: MainLift; percentage: number }
> = {
	squat_variation: { lift: "squat", percentage: 0.6 },
	bench_variation: { lift: "bench", percentage: 0.6 },
	deadlift_variation: { lift: "deadlift", percentage: 0.55 },
	compound_leg: { lift: "squat", percentage: 0.45 },
	chest: { lift: "bench", percentage: 0.45 },
	vertical_pull: { lift: "deadlift", percentage: 0.3 },
	lateral_pull: { lift: "deadlift", percentage: 0.35 },
	quad: { lift: "squat", percentage: 0.25 },
	hamstring_glute: { lift: "squat", percentage: 0.25 },
	calf: { lift: "squat", percentage: 0.3 },
	tricep: { lift: "bench", percentage: 0.25 },
	bicep: { lift: "bench", percentage: 0.2 },
	delt: { lift: "ohp", percentage: 0.35 },
};

export const estimateWeight = (
	category: ExerciseCategory,
	lifts: UserLifts,
): number | null => {
	const { lift, percentage } = CATEGORY_LIFT_MAP[category];
	const oneRepMax = lifts[lift];
	if (oneRepMax === null) {
		return null;
	}
	return calculateWeight(oneRepMax, percentage, lifts.unit);
};
