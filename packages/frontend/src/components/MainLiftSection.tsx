import { useState } from "react";
import { SetCard } from "./SetCard";

const LIFT_DISPLAY_NAMES: Record<string, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

interface MainLiftSectionProps {
	mainLift: string;
	sets: Array<{
		setNumber: number;
		weight: number;
		reps: number;
		percentage: number;
		isAmrap: boolean;
	}>;
	unit?: string;
	onLogSet: (data: Record<string, unknown>) => void;
}

export function MainLiftSection({
	mainLift,
	sets,
	unit = "lbs",
	onLogSet,
}: MainLiftSectionProps) {
	const [completedCount, setCompletedCount] = useState(0);
	const displayName = LIFT_DISPLAY_NAMES[mainLift] ?? mainLift;

	return (
		<section>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-bold">{displayName}</h2>
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
						unit={unit}
						onComplete={(data) => {
							setCompletedCount((c) => c + 1);
							onLogSet({
								exerciseName: displayName,
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
