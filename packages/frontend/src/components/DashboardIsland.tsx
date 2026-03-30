import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { DAY_NAMES } from "@powercycle/shared/schema/program";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom } from "../atoms/cycles";
import { startWorkoutAtom } from "../atoms/workouts";
import WeightManagement from "./WeightManagement";

const ROUND_NAMES: Record<number, string> = {
	1: "Volume",
	2: "Strength",
	3: "Test",
	4: "Deload",
};

export default function DashboardIsland() {
	const [isStarting, setIsStarting] = useState(false);
	const result = useAtomValue(currentCycleAtom);
	const startWorkout = useAtomSet(startWorkoutAtom, {
		mode: "promiseExit",
	});

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-neutral-500">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-neutral-500">Failed to load cycle data.</p>
			</div>
		);
	}

	const cycle = result.value;

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
				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 w-full max-w-md">
					<h1 className="text-2xl font-semibold text-neutral-100 mb-4">
						Cycle complete
					</h1>
					<p className="text-neutral-400 mb-8">
						Cycle {cycle.cycleNumber} finished. Time to calculate your new
						maxes.
					</p>
					<a
						href="/progression"
						className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors block w-full text-center"
					>
						View progression
					</a>
				</div>
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
			<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 w-full max-w-md">
				<p className="text-sm text-neutral-400 mb-4">
					Cycle {cycle.cycleNumber} &middot; Round {cycle.currentRound} (
					{roundName})
				</p>
				<h1 className="text-2xl font-semibold text-neutral-100 mb-2">
					{dayName} day
				</h1>
				<p className="text-neutral-400 mb-8">Day {cycle.currentDay} of 4</p>
				<button
					type="button"
					onClick={handleStart}
					disabled={isStarting}
					className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors w-full disabled:opacity-50"
				>
					{isStarting ? "Starting..." : "Start workout"}
				</button>
			</div>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
