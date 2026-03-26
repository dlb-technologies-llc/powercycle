import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { useState } from "react";
import { SetCard } from "./SetCard";

interface VariationSectionProps {
	variation: {
		category: string;
		defaultExercise: string;
		sets: Array<{
			setNumber: number;
			rpeMin: number;
			rpeMax: number;
			repMin: number;
			repMax: number;
		}>;
	};
	onLogSet: (data: Record<string, unknown>) => void;
}

function getInitialExercise(category: string, defaultExercise: string): string {
	if (typeof window === "undefined") return defaultExercise;
	const stored = localStorage.getItem(`exercise-pref-${category}-variation`);
	if (stored) {
		const options = EXERCISE_OPTIONS[category as keyof typeof EXERCISE_OPTIONS];
		if (options?.includes(stored)) return stored;
	}
	return defaultExercise;
}

export function VariationSection({
	variation,
	onLogSet,
}: VariationSectionProps) {
	const [completedCount, setCompletedCount] = useState(0);
	const [selectedExercise, setSelectedExercise] = useState(() =>
		getInitialExercise(variation.category, variation.defaultExercise),
	);

	const options =
		EXERCISE_OPTIONS[variation.category as keyof typeof EXERCISE_OPTIONS] ?? [];

	const handleExerciseChange = (value: string) => {
		setSelectedExercise(value);
		if (typeof window !== "undefined") {
			localStorage.setItem(
				`exercise-pref-${variation.category}-variation`,
				value,
			);
		}
	};

	return (
		<section>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-bold">Variation</h2>
				<span className="text-sm text-zinc-500">
					{completedCount}/{variation.sets.length}
				</span>
			</div>
			<div className="mb-3">
				<select
					value={selectedExercise}
					onChange={(e) => handleExerciseChange(e.target.value)}
					className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 text-sm"
				>
					{options.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-3">
				{variation.sets.map((set) => (
					<SetCard
						key={set.setNumber}
						setNumber={set.setNumber}
						rpeTarget={`RPE ${set.rpeMin}-${set.rpeMax}`}
						repRange={`${set.repMin}-${set.repMax} reps`}
						onComplete={(data) => {
							setCompletedCount((c) => c + 1);
							onLogSet({
								exerciseName: selectedExercise,
								setNumber: set.setNumber,
								actualWeight: data.actualWeight ?? null,
								actualReps: data.actualReps,
								rpe: data.rpe ?? null,
								isMainLift: false,
								isAmrap: false,
							});
						}}
					/>
				))}
			</div>
		</section>
	);
}
