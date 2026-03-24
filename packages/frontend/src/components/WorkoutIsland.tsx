import { useState } from "react";
import { apiFetch } from "../lib/api";
import { AccessorySection } from "./AccessorySection";
import { MainLiftSection } from "./MainLiftSection";
import { VariationSection } from "./VariationSection";

interface WorkoutIslandProps {
	workoutId?: string;
}

export default function WorkoutIsland({ workoutId }: WorkoutIslandProps) {
	const id =
		workoutId ??
		(typeof window !== "undefined"
			? new URLSearchParams(window.location.search).get("id")
			: null);
	const [isFinishing, setIsFinishing] = useState(false);

	if (!id) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">No workout ID provided.</p>
			</div>
		);
	}

	const handleFinish = async () => {
		setIsFinishing(true);
		try {
			await apiFetch(`/api/workouts/${id}/complete`, {
				method: "POST",
			});
			window.location.href = "/";
		} catch (err) {
			console.error("Failed to complete workout", err);
			setIsFinishing(false);
		}
	};

	const handleLogSet = (data: Record<string, unknown>) => {
		apiFetch(`/api/workouts/${id}/sets`, {
			method: "POST",
			body: JSON.stringify(data),
		}).catch((err) => console.error("Failed to log set", err));
	};

	return (
		<div className="space-y-8 pb-24">
			<div>
				<h1 className="text-2xl font-bold">Workout</h1>
				<p className="text-zinc-400 text-sm mt-1">
					Complete your sets, then finish the workout.
				</p>
			</div>

			<MainLiftSection onLogSet={handleLogSet} />
			<VariationSection onLogSet={handleLogSet} />
			<AccessorySection onLogSet={handleLogSet} />

			<div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950 border-t border-zinc-800">
				<div className="max-w-2xl mx-auto">
					<button
						type="button"
						onClick={handleFinish}
						disabled={isFinishing}
						className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors"
					>
						{isFinishing ? "Finishing..." : "Finish Workout"}
					</button>
				</div>
			</div>
		</div>
	);
}
