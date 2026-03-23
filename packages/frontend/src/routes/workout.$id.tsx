import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AccessorySection } from "../components/AccessorySection";
import { MainLiftSection } from "../components/MainLiftSection";
import { VariationSection } from "../components/VariationSection";
import { useCompleteWorkout } from "../lib/queries";

export const Route = createFileRoute("/workout/$id")({
	component: WorkoutPage,
});

function WorkoutPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const completeWorkout = useCompleteWorkout();
	const [isFinishing, setIsFinishing] = useState(false);

	const handleFinish = async () => {
		setIsFinishing(true);
		try {
			await completeWorkout.mutateAsync(id);
			navigate({ to: "/" });
		} catch (err) {
			console.error("Failed to complete workout", err);
			setIsFinishing(false);
		}
	};

	return (
		<div className="space-y-8 pb-24">
			<div>
				<h1 className="text-2xl font-bold">Workout</h1>
				<p className="text-zinc-400 text-sm mt-1">
					Complete your sets, then finish the workout.
				</p>
			</div>

			<MainLiftSection workoutId={id} />
			<VariationSection workoutId={id} />
			<AccessorySection workoutId={id} />

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
