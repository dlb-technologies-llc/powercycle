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
	currentRound: 1 | 2 | 3 | 4;
	currentDay: 1 | 2 | 3 | 4;
	squat1rm: number | null;
	bench1rm: number | null;
	deadlift1rm: number | null;
	ohp1rm: number | null;
	unit: "lbs" | "kg";
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
				<p className="text-zinc-400">Failed to load cycle data.</p>
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
				<div className="glass-card p-8 w-full max-w-md">
					<h1 className="gradient-text-green text-5xl font-[family-name:var(--font-heading)] uppercase tracking-wider mb-4 animate-fade-in">
						CYCLE COMPLETE
					</h1>
					<p
						className="text-zinc-400 mb-8 animate-fade-in"
						style={{ animationDelay: "100ms" }}
					>
						Cycle {cycle.cycleNumber} finished. Time to calculate your new
						maxes.
					</p>
					<a
						href="/progression"
						className="btn-gradient-green block w-full min-h-20 flex items-center justify-center text-xl rounded-2xl animate-fade-in"
						style={{ animationDelay: "200ms" }}
					>
						View Progression
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
			<div className="glass-card p-8 w-full max-w-md">
				<p
					className="text-sm text-zinc-500 mb-4 animate-fade-in"
					style={{ animationDelay: "0ms" }}
				>
					Cycle {cycle.cycleNumber} &middot; Round {cycle.currentRound} (
					{roundName})
				</p>
				<h1
					className="gradient-text-cyan text-5xl font-[family-name:var(--font-heading)] uppercase tracking-wider mb-2 animate-fade-in"
					style={{ animationDelay: "100ms" }}
				>
					{dayName} Day
				</h1>
				<p
					className="text-zinc-400 mb-8 animate-fade-in"
					style={{ animationDelay: "200ms" }}
				>
					Day {cycle.currentDay} of 4
				</p>
				<button
					type="button"
					onClick={handleStart}
					disabled={isStarting}
					className="btn-gradient-cyan w-full min-h-20 text-xl rounded-2xl disabled:opacity-50 animate-fade-in animate-glow-cyan"
					style={{ animationDelay: "300ms" }}
				>
					{isStarting ? "Starting..." : "START WORKOUT"}
				</button>
			</div>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
