import { useState } from "react";
import { useLogSet } from "../lib/queries";
import { SetCard } from "./SetCard";

interface AccessorySectionProps {
	workoutId: string;
}

export function AccessorySection({ workoutId }: AccessorySectionProps) {
	const logSet = useLogSet();
	const [isOpen, setIsOpen] = useState(false);
	const [completedCount, setCompletedCount] = useState(0);

	// V1: placeholder accessory sets
	const accessories = [
		{ name: "Accessory 1", sets: 3 },
		{ name: "Accessory 2", sets: 3 },
	];

	const totalSets = accessories.reduce((sum, a) => sum + a.sets, 0);

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
					{accessories.map((accessory) => (
						<div key={accessory.name}>
							<p className="text-sm text-zinc-400 mb-2">{accessory.name}</p>
							<div className="space-y-3">
								{Array.from({ length: accessory.sets }, (_, i) => (
									<SetCard
										key={`${accessory.name}-${i}`}
										setNumber={i + 1}
										rpeTarget="RPE 7-9"
										repRange="8-12 reps"
										onComplete={(data) => {
											setCompletedCount((c) => c + 1);
											logSet.mutate({
												workoutId,
												exerciseName: accessory.name,
												setNumber: i + 1,
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
						</div>
					))}
				</div>
			)}
		</section>
	);
}
