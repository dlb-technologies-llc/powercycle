import type { WorkoutPlanResponse } from "@powercycle/shared/schema/api";
import { useCallback, useEffect, useMemo, useState } from "react";

type WorkoutPlan = typeof WorkoutPlanResponse.Type;

export interface FlatSet {
	exerciseName: string;
	category: string | null;
	setNumber: number;
	prescribed: {
		weight?: number;
		reps?: number;
		percentage?: number;
		rpeMin?: number;
		rpeMax?: number;
		repMin?: number;
		repMax?: number;
	};
	isMainLift: boolean;
	isAmrap: boolean;
	preferredWeight?: number;
	lastSession?: {
		weight: number | null;
		reps: number | null;
		rpe: number | null;
	};
}

export type WorkoutPhase =
	| "overview"
	| "ready"
	| "active"
	| "resting"
	| "complete";

const LIFT_DISPLAY_NAMES: Record<string, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

export function useWorkoutFlow(plan: WorkoutPlan | null) {
	const [phase, setPhase] = useState<WorkoutPhase>("overview");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [selections, setSelections] = useState<Record<string, string>>({});
	const [resumeIndex, setResumeIndex] = useState<number | null>(null);

	const flatSets = useMemo(() => {
		if (!plan) return [];
		const sets: FlatSet[] = [];

		// Main lift sets
		const mainLiftName = LIFT_DISPLAY_NAMES[plan.mainLift] ?? plan.mainLift;
		for (const s of plan.mainLiftSets) {
			sets.push({
				exerciseName: mainLiftName,
				category: null,
				setNumber: s.setNumber,
				prescribed: {
					weight: s.weight,
					reps: s.reps,
					percentage: s.percentage,
				},
				isMainLift: true,
				isAmrap: s.isAmrap,
			});
		}

		// Variation sets
		const variationKey = `${plan.variation.category}-variation`;
		const variationName =
			selections[variationKey] || plan.variation.defaultExercise;
		for (const s of plan.variation.sets) {
			sets.push({
				exerciseName: variationName,
				category: plan.variation.category,
				setNumber: s.setNumber,
				prescribed: {
					rpeMin: s.rpeMin,
					rpeMax: s.rpeMax,
					repMin: s.repMin,
					repMax: s.repMax,
				},
				isMainLift: false,
				isAmrap: false,
				preferredWeight: plan.variation.preferredWeight ?? undefined,
				lastSession: plan.variation.lastSession ?? undefined,
			});
		}

		// Accessory sets
		plan.accessories.forEach((slot, slotIndex) => {
			const accKey = `${slot.category}-${slotIndex}`;
			const accName = selections[accKey] || slot.defaultExercise;
			for (const s of slot.sets) {
				sets.push({
					exerciseName: accName,
					category: slot.category,
					setNumber: s.setNumber,
					prescribed: {
						rpeMin: s.rpeMin,
						rpeMax: s.rpeMax,
						repMin: s.repMin,
						repMax: s.repMax,
					},
					isMainLift: false,
					isAmrap: false,
					preferredWeight: slot.preferredWeight ?? undefined,
					lastSession: slot.lastSession ?? undefined,
				});
			}
		});

		return sets;
	}, [plan, selections]);

	const currentSet = flatSets[currentIndex] ?? null;
	const totalSets = flatSets.length;
	const isLastSet = currentIndex === totalSets - 1;
	const nextSet = flatSets[currentIndex + 1] ?? null;
	const nextExerciseName = nextSet?.exerciseName ?? null;
	const previousSet = currentIndex > 0 ? flatSets[currentIndex - 1] : null;

	// True when the current exercise is different from the previous one (exercise transition)
	const isExerciseTransition =
		previousSet === null ||
		previousSet.exerciseName !== currentSet?.exerciseName;

	// All sets for the current exercise
	const allSetsForCurrentExercise = useMemo(() => {
		if (!currentSet) return [];
		return flatSets.filter((s) => s.exerciseName === currentSet.exerciseName);
	}, [flatSets, currentSet]);

	// Number of completed sets for the current exercise (sets before currentIndex with same name)
	const completedSetsForCurrentExercise = useMemo(() => {
		if (!currentSet) return 0;
		let count = 0;
		for (let i = 0; i < currentIndex; i++) {
			if (flatSets[i].exerciseName === currentSet.exerciseName) {
				count++;
			}
		}
		return count;
	}, [flatSets, currentIndex, currentSet]);

	const startWorkout = useCallback(
		(exerciseSelections: Record<string, string>) => {
			setSelections(exerciseSelections);
			setCurrentIndex(0);
			setPhase("ready");
		},
		[],
	);

	const initializeAt = useCallback(
		(completedCount: number, exerciseSelections: Record<string, string>) => {
			setSelections(exerciseSelections);
			setResumeIndex(completedCount);
		},
		[],
	);

	// Effect: once flatSets recomputes after selections change, apply the resume index
	useEffect(() => {
		if (resumeIndex === null) return;
		if (flatSets.length === 0) {
			// Plan has no sets or flatSets not yet computed — clear and stay on overview
			setResumeIndex(null);
			return;
		}
		if (resumeIndex >= flatSets.length) {
			setCurrentIndex(flatSets.length - 1);
			setPhase("complete");
		} else {
			setCurrentIndex(resumeIndex);
			setPhase("ready");
		}
		setResumeIndex(null);
	}, [resumeIndex, flatSets.length]);

	const startSet = useCallback(() => {
		setPhase("active");
	}, []);

	const completeSet = useCallback(() => {
		setPhase("resting");
	}, []);

	const confirmAndNext = useCallback(() => {
		if (isLastSet) {
			setPhase("complete");
		} else {
			const next = flatSets[currentIndex + 1];
			if (next && next.exerciseName === currentSet?.exerciseName) {
				// Same exercise — go straight to active (skip ready)
				setCurrentIndex((i) => i + 1);
				setPhase("active");
			} else {
				// New exercise — show ready screen
				setCurrentIndex((i) => i + 1);
				setPhase("ready");
			}
		}
	}, [isLastSet, flatSets, currentIndex, currentSet]);

	return {
		phase,
		currentSet,
		totalSets,
		isLastSet,
		nextExerciseName,
		isExerciseTransition,
		allSetsForCurrentExercise,
		completedSetsForCurrentExercise,
		progress: { current: currentIndex + 1, total: totalSets },
		startWorkout,
		initializeAt,
		startSet,
		completeSet,
		confirmAndNext,
	};
}
