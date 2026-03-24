import { useState } from "react";
import { SetCard } from "./SetCard";

interface MainLiftSectionProps {
	onLogSet: (data: Record<string, unknown>) => void;
}

export function MainLiftSection({ onLogSet }: MainLiftSectionProps) {
	const [completedCount, setCompletedCount] = useState(0);

	// V1: placeholder sets. In the real app, these come from the workout plan.
	const sets = [
		{ setNumber: 1, weight: 140, reps: 10, isAmrap: false },
		{ setNumber: 2, weight: 175, reps: 5, isAmrap: false },
		{ setNumber: 3, weight: 205, reps: 5, isAmrap: false },
		{ setNumber: 4, weight: 235, reps: 5, isAmrap: false },
		{ setNumber: 5, weight: 270, reps: 5, isAmrap: true },
		{ setNumber: 6, weight: 270, reps: 5, isAmrap: true },
	];

	return (
		<section>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-bold">Main Lift</h2>
				<span className="text-sm text-zinc-500">
					{completedCount}/{sets.length}
				</span>
			</div>
			<div className="space-y-3">
				{sets.map((set) => (
					<SetCard
						key={set.setNumber}
						setNumber={set.setNumber}
						prescribedWeight={set.weight}
						prescribedReps={set.reps}
						isAmrap={set.isAmrap}
						onComplete={(data) => {
							setCompletedCount((c) => c + 1);
							onLogSet({
								exerciseName: "Squat",
								setNumber: set.setNumber,
								prescribedWeight: set.weight,
								actualWeight: data.actualWeight ?? null,
								prescribedReps: set.reps,
								actualReps: data.actualReps,
								isMainLift: true,
								isAmrap: set.isAmrap,
							});
						}}
					/>
				))}
			</div>
		</section>
	);
}
