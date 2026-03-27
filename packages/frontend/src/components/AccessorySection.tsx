import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { useState } from "react";
import { SetCard } from "./SetCard";

interface AccessorySlot {
	category: string;
	defaultExercise: string;
	sets: Array<{
		setNumber: number;
		rpeMin: number;
		rpeMax: number;
		repMin: number;
		repMax: number;
	}>;
}

interface AccessorySectionProps {
	accessories: Array<AccessorySlot>;
	onLogSet: (data: Record<string, unknown>) => void;
}

function getInitialExercise(
	category: string,
	index: number,
	defaultExercise: string,
): string {
	if (typeof window === "undefined") return defaultExercise;
	const stored = localStorage.getItem(
		`exercise-pref-${category}-${String(index)}`,
	);
	if (stored) {
		const options = EXERCISE_OPTIONS[category as keyof typeof EXERCISE_OPTIONS];
		if (options?.includes(stored)) return stored;
	}
	return defaultExercise;
}

export function AccessorySection({
	accessories,
	onLogSet,
}: AccessorySectionProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [completedCount, setCompletedCount] = useState(0);
	const [selectedExercises, setSelectedExercises] = useState<string[]>(() =>
		accessories.map((slot, i) =>
			getInitialExercise(slot.category, i, slot.defaultExercise),
		),
	);

	const totalSets = accessories.reduce(
		(sum, slot) => sum + slot.sets.length,
		0,
	);

	const handleExerciseChange = (
		index: number,
		category: string,
		value: string,
	) => {
		setSelectedExercises((prev) => {
			const next = [...prev];
			next[index] = value;
			return next;
		});
		if (typeof window !== "undefined") {
			localStorage.setItem(`exercise-pref-${category}-${String(index)}`, value);
		}
	};

	return (
		<section>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-between w-full mb-4"
			>
				<h2 className="text-lg font-bold">Accessories</h2>
				<div className="flex items-center gap-2">
					<span className="text-sm text-zinc-500">
						{completedCount}/{totalSets} — Optional
					</span>
					<span className="text-zinc-500">{isOpen ? "\u25B2" : "\u25BC"}</span>
				</div>
			</button>
			{isOpen && (
				<div className="space-y-6">
					{accessories.map((slot, slotIndex) => {
						const options =
							EXERCISE_OPTIONS[
								slot.category as keyof typeof EXERCISE_OPTIONS
							] ?? [];
						const exerciseName =
							selectedExercises[slotIndex] ?? slot.defaultExercise;

						return (
							<div key={`${slot.category}-${String(slotIndex)}`}>
								<div className="mb-2">
									<select
										value={exerciseName}
										onChange={(e) =>
											handleExerciseChange(
												slotIndex,
												slot.category,
												e.target.value,
											)
										}
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
									{slot.sets.map((set) => (
										<SetCard
											key={`${slot.category}-${String(slotIndex)}-set-${String(set.setNumber)}`}
											setNumber={set.setNumber}
											rpeTarget={`RPE ${set.rpeMin}-${set.rpeMax}`}
											repRange={`${set.repMin}-${set.repMax} reps`}
											onComplete={(data) => {
												setCompletedCount((c) => c + 1);
												onLogSet({
													exerciseName,
													setNumber: set.setNumber,
													actualWeight: data.actualWeight ?? null,
													actualReps: data.actualReps,
													rpe: data.rpe ?? null,
													prescribedRpeMin: set.rpeMin,
													prescribedRpeMax: set.rpeMax,
													isMainLift: false,
													isAmrap: false,
												});
											}}
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</section>
	);
}
