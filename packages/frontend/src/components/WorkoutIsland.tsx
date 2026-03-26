import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import {
	completeWorkoutAtom,
	logSetAtom,
	nextWorkoutAtom,
} from "../atoms/workouts";
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

	const result = useAtomValue(nextWorkoutAtom);
	const logSet = useAtomSet(logSetAtom, { mode: "promiseExit" });
	const completeWorkout = useAtomSet(completeWorkoutAtom, {
		mode: "promiseExit",
	});

	if (!id) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">No workout ID provided.</p>
			</div>
		);
	}

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading workout plan...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-red-400">Failed to load workout plan.</p>
			</div>
		);
	}

	const plan = result.value as {
		day: number;
		round: number;
		cycle: number;
		mainLift: string;
		mainLiftSets: Array<{
			setNumber: number;
			weight: number;
			reps: number;
			percentage: number;
			isAmrap: boolean;
		}>;
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
		accessories: Array<{
			category: string;
			defaultExercise: string;
			sets: Array<{
				setNumber: number;
				rpeMin: number;
				rpeMax: number;
				repMin: number;
				repMax: number;
			}>;
		}>;
	} | null;

	if (!plan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<p className="text-zinc-400 mb-4">No workout available.</p>
				<a
					href="/"
					className="text-zinc-100 underline hover:text-zinc-300 transition-colors"
				>
					Back to Dashboard
				</a>
			</div>
		);
	}

	const handleFinish = async () => {
		setIsFinishing(true);
		const exit = await completeWorkout({ params: { id } });
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to complete workout");
				setIsFinishing(false);
			},
			onSuccess: () => {
				window.location.href = "/";
			},
		});
	};

	const handleLogSet = (data: Record<string, unknown>) => {
		logSet({
			params: { id },
			payload: data as {
				exerciseName: string;
				setNumber: number;
				prescribedWeight: number | null;
				actualWeight: number | null;
				prescribedReps: number | null;
				actualReps: number | null;
				rpe: number | null;
				isMainLift: boolean;
				isAmrap: boolean;
			},
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

			<MainLiftSection
				mainLift={plan.mainLift}
				sets={plan.mainLiftSets}
				unit="lbs"
				onLogSet={handleLogSet}
			/>
			<VariationSection variation={plan.variation} onLogSet={handleLogSet} />
			<AccessorySection
				accessories={plan.accessories}
				onLogSet={handleLogSet}
			/>

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
