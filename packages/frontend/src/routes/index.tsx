import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getToken } from "../lib/api";
import { useCurrentCycle, useStartWorkout } from "../lib/queries";

export const Route = createFileRoute("/")({
	component: DashboardPage,
});

const DAY_NAMES: Record<number, string> = {
	1: "Squat",
	2: "Bench Press",
	3: "Deadlift",
	4: "Overhead Press",
	5: "Rest",
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
	completedAt: string | null;
}

function DashboardPage() {
	const navigate = useNavigate();
	const { data, isLoading, isError } = useCurrentCycle();
	const startWorkout = useStartWorkout();

	const cycle = data as CycleData | undefined;

	// Auth guard
	useEffect(() => {
		if (!getToken()) {
			navigate({ to: "/login" });
		}
	}, [navigate]);

	// No cycle -> setup
	useEffect(() => {
		if (!isLoading && !isError && !cycle) {
			navigate({ to: "/setup" });
		}
	}, [cycle, isLoading, isError, navigate]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading...</p>
			</div>
		);
	}

	if (!cycle) return null;

	// Cycle complete — show progression link
	if (cycle.completedAt) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<h1 className="text-4xl font-bold mb-4">
					Cycle {cycle.cycleNumber} Complete
				</h1>
				<p className="text-zinc-400 mb-8">
					Time to calculate your new maxes and start the next cycle.
				</p>
				<Link
					to="/progression"
					className="w-full max-w-xs py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-500 transition-colors text-center block"
				>
					View Progression
				</Link>
			</div>
		);
	}

	const isRestDay = cycle.currentDay === 5;
	const dayName = DAY_NAMES[cycle.currentDay] ?? "Unknown";
	const roundName = ROUND_NAMES[cycle.currentRound] ?? "Unknown";

	const handleStart = async () => {
		try {
			const workout = (await startWorkout.mutateAsync({
				cycleId: cycle.id,
				round: cycle.currentRound,
				day: cycle.currentDay,
			})) as { id: string };
			navigate({ to: "/workout/$id", params: { id: workout.id } });
		} catch (err) {
			console.error("Failed to start workout", err);
		}
	};

	if (isRestDay) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<h1 className="text-4xl font-bold mb-4">Rest Day</h1>
				<p className="text-zinc-400 mb-8">
					Recovery is part of the program. Take it easy today.
				</p>
				<p className="text-sm text-zinc-500">
					Cycle {cycle.cycleNumber} — Round {cycle.currentRound} ({roundName})
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
			<p className="text-sm text-zinc-500 mb-4">
				Cycle {cycle.cycleNumber} — Round {cycle.currentRound} ({roundName})
			</p>
			<h1 className="text-4xl font-bold mb-2">{dayName} Day</h1>
			<p className="text-zinc-400 mb-2">Day {cycle.currentDay} of 5</p>
			<div className="w-full max-w-xs mt-8">
				<button
					type="button"
					onClick={handleStart}
					disabled={startWorkout.isPending}
					className="w-full py-5 bg-zinc-100 text-zinc-900 font-bold text-xl rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
				>
					{startWorkout.isPending ? "Starting..." : "Start Workout"}
				</button>
			</div>
		</div>
	);
}
