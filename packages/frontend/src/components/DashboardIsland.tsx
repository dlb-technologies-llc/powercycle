import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { DAY_NAMES } from "@powercycle/shared/schema/program";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom, endCycleAtom } from "../atoms/cycles";
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
	const [endCycleConfirm, setEndCycleConfirm] = useState(false);
	const [isEnding, setIsEnding] = useState(false);
	const result = useAtomValue(currentCycleAtom);
	const startWorkout = useAtomSet(startWorkoutAtom, {
		mode: "promiseExit",
	});
	const endCycle = useAtomSet(endCycleAtom, {
		mode: "promiseExit",
	});

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-gray-500">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-gray-500">Failed to load cycle data.</p>
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
				<div className="card w-full max-w-md p-8">
					<h1 className="text-2xl font-bold text-black mb-4">Cycle complete</h1>
					<p className="text-gray-600 mb-8">
						Cycle {cycle.cycleNumber} finished. Time to calculate your new
						maxes.
					</p>
					<a
						href="/progression"
						className="btn-primary w-full block text-center"
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

	const handleEndCycle = async () => {
		setIsEnding(true);
		const exit = await endCycle({});
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to end cycle");
				setIsEnding(false);
				setEndCycleConfirm(false);
			},
			onSuccess: () => {
				window.location.reload();
			},
		});
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
			<div className="card w-full max-w-md p-8">
				<p className="text-sm text-gray-600 mb-4">
					Cycle {cycle.cycleNumber} &middot; Round {cycle.currentRound} (
					{roundName})
				</p>
				<h1 className="text-2xl font-bold text-black mb-2">{dayName} day</h1>
				<p className="text-gray-600 mb-8">Day {cycle.currentDay} of 4</p>
				<button
					type="button"
					onClick={handleStart}
					disabled={isStarting}
					className="btn-primary w-full"
				>
					{isStarting ? "Starting..." : "Start workout"}
				</button>

				<div className="mt-6 pt-6 border-t border-gray-200">
					{endCycleConfirm ? (
						<div>
							<p className="text-sm text-gray-600 mb-3">
								Are you sure? This will end your current cycle.
							</p>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={() => setEndCycleConfirm(false)}
									disabled={isEnding}
									className="btn-secondary flex-1"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleEndCycle}
									disabled={isEnding}
									className="btn-danger flex-1"
								>
									{isEnding ? "Ending..." : "Confirm"}
								</button>
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setEndCycleConfirm(true)}
							className="btn-ghost w-full"
						>
							End cycle
						</button>
					)}
				</div>
			</div>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
