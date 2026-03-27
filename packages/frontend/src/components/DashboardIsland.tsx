import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom } from "../atoms/cycles";
import { startWorkoutAtom } from "../atoms/workouts";
import WeightManagement from "./WeightManagement";

const DAY_NAMES: Record<number, string> = {
	1: "Squat",
	2: "Bench Press",
	3: "Deadlift",
	4: "Overhead Press",
};

const ROUND_NAMES: Record<number, string> = {
	1: "Volume",
	2: "Strength",
	3: "Test",
	4: "Deload",
};

interface CycleData {
	id: string;
	cycleNumber: number;
	currentRound: number;
	currentDay: number;
	squat1rm: number | null;
	bench1rm: number | null;
	deadlift1rm: number | null;
	ohp1rm: number | null;
	unit: string;
	completedAt: string | null;
}

export default function DashboardIsland() {
	const [isStarting, setIsStarting] = useState(false);
	const result = useAtomValue(currentCycleAtom);
	const startWorkout = useAtomSet(startWorkoutAtom, {
		mode: "promiseExit",
	});

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-red-400">Failed to load cycle data.</p>
			</div>
		);
	}

	const cycle = result.value as CycleData | null;

	// No cycle -> setup
	if (!cycle) {
		if (typeof window !== "undefined") {
			window.location.href = "/setup";
		}
		return null;
	}

	// Cycle complete
	if (cycle.completedAt) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<h1 className="text-4xl font-bold mb-4">
					Cycle {cycle.cycleNumber} Complete
				</h1>
				<p className="text-zinc-400 mb-8">
					Time to calculate your new maxes and start the next cycle.
				</p>
				<a
					href="/progression"
					className="w-full max-w-xs py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-500 transition-colors text-center block"
				>
					View Progression
				</a>
			</div>
		);
	}

	const dayName = DAY_NAMES[cycle.currentDay] ?? "Unknown";
	const roundName = ROUND_NAMES[cycle.currentRound] ?? "Unknown";

	const handleStart = async () => {
		setIsStarting(true);
		const exit = await startWorkout({
			payload: {
				cycleId: cycle.id,
				round: cycle.currentRound,
				day: cycle.currentDay,
			},
		});
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to start workout");
				setIsStarting(false);
			},
			onSuccess: (workout: { id: string }) => {
				window.location.href = `/workout?id=${workout.id}`;
			},
		});
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
			<p className="text-sm text-zinc-500 mb-4">
				Cycle {cycle.cycleNumber} — Round {cycle.currentRound} ({roundName})
			</p>
			<h1 className="text-4xl font-bold mb-2">{dayName} Day</h1>
			<p className="text-zinc-400 mb-2">Day {cycle.currentDay} of 4</p>
			<div className="w-full max-w-xs mt-8">
				<button
					type="button"
					onClick={handleStart}
					disabled={isStarting}
					className="w-full py-5 bg-zinc-100 text-zinc-900 font-bold text-xl rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
				>
					{isStarting ? "Starting..." : "Start Workout"}
				</button>
			</div>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
