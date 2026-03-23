import { useState } from "react";
import { useLogSet } from "../lib/queries";
import { SetCard } from "./SetCard";

interface VariationSectionProps {
	workoutId: string;
}

export function VariationSection({ workoutId }: VariationSectionProps) {
	const logSet = useLogSet();
	const [completedCount, setCompletedCount] = useState(0);

	// V1: placeholder RPE sets
	const sets = Array.from({ length: 6 }, (_, i) => ({
		setNumber: i + 1,
		rpeMin: 5,
		rpeMax: i < 5 ? 7 : 8,
		repMin: 6,
		repMax: 10,
	}));

	return (
		<section>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-bold">Variation</h2>
				<span className="text-sm text-zinc-500">
					{completedCount}/{sets.length}
				</span>
			</div>
			<p className="text-sm text-zinc-400 mb-3">Pick your variation exercise</p>
			<div className="space-y-3">
				{sets.map((set) => (
					<SetCard
						key={set.setNumber}
						setNumber={set.setNumber}
						rpeTarget={`RPE ${set.rpeMin}-${set.rpeMax}`}
						repRange={`${set.repMin}-${set.repMax} reps`}
						onComplete={(data) => {
							setCompletedCount((c) => c + 1);
							logSet.mutate({
								workoutId,
								exerciseName: "Variation",
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
