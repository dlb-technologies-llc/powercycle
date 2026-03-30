import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { DAY_NAMES } from "@powercycle/shared/schema/program";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { currentCycleAtom, endCycleAtom } from "../atoms/cycles";
import {
	completeWorkoutAtom,
	currentWorkoutAtom,
	startWorkoutAtom,
} from "../atoms/workouts";
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
	const [endWorkoutConfirm, setEndWorkoutConfirm] = useState(false);
	const [isEndingWorkout, setIsEndingWorkout] = useState(false);
	const result = useAtomValue(currentCycleAtom);
	const workoutResult = useAtomValue(currentWorkoutAtom);
	const startWorkout = useAtomSet(startWorkoutAtom, {
		mode: "promiseExit",
	});
	const endCycle = useAtomSet(endCycleAtom, {
		mode: "promiseExit",
	});
	const completeWorkout = useAtomSet(completeWorkoutAtom, {
		mode: "promiseExit",
	});

	const currentWorkout = (() => {
		if (AsyncResult.isInitial(workoutResult) || workoutResult.waiting)
			return undefined;
		if (AsyncResult.isFailure(workoutResult)) return null;
		return workoutResult.value;
	})();

	if (
		AsyncResult.isInitial(result) ||
		result.waiting ||
		currentWorkout === undefined
	) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-muted-foreground">Failed to load cycle data.</p>
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
				<Card className="w-full max-w-md">
					<CardContent className="p-8">
						<h1 className="text-2xl font-bold text-foreground mb-4">
							Cycle complete
						</h1>
						<p className="text-muted-foreground mb-8">
							Cycle {cycle.cycleNumber} finished. Time to calculate your new
							maxes.
						</p>
						<Button asChild className="w-full">
							<a href="/progression">View progression</a>
						</Button>
					</CardContent>
				</Card>
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

	const handleEndWorkout = async () => {
		if (!currentWorkout) return;
		setIsEndingWorkout(true);
		const exit = await completeWorkout({ params: { id: currentWorkout.id } });
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to end workout");
				setIsEndingWorkout(false);
				setEndWorkoutConfirm(false);
			},
			onSuccess: () => {
				window.location.reload();
			},
		});
	};

	const handleEndCycle = async () => {
		setIsEnding(true);
		if (currentWorkout) {
			const workoutExit = await completeWorkout({
				params: { id: currentWorkout.id },
			});
			const failed = Exit.match(workoutExit, {
				onFailure: () => true,
				onSuccess: () => false,
			});
			if (failed) {
				console.error("Failed to end in-progress workout before ending cycle");
				setIsEnding(false);
				setEndCycleConfirm(false);
				return;
			}
		}
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
			<Card className="w-full max-w-md">
				<CardContent className="p-8">
					<p className="text-sm text-muted-foreground mb-4">
						Cycle {cycle.cycleNumber} &middot; Round {cycle.currentRound} (
						{roundName})
					</p>
					<h1 className="text-2xl font-bold text-foreground mb-2">
						{dayName} day
					</h1>
					<p className="text-muted-foreground mb-8">
						Day {cycle.currentDay} of 4
					</p>

					{currentWorkout ? (
						<>
							<Button asChild className="w-full">
								<a href={`/workout?id=${currentWorkout.id}`}>
									Continue workout
								</a>
							</Button>

							<div className="mt-6 pt-6 border-t border-border">
								{endWorkoutConfirm ? (
									<div>
										<p className="text-sm text-muted-foreground mb-3">
											End without finishing remaining sets?
										</p>
										<div className="flex gap-3">
											<Button
												type="button"
												variant="secondary"
												onClick={() => setEndWorkoutConfirm(false)}
												disabled={isEndingWorkout}
												className="flex-1"
											>
												Cancel
											</Button>
											<Button
												type="button"
												variant="destructive"
												onClick={handleEndWorkout}
												disabled={isEndingWorkout}
												className="flex-1"
											>
												{isEndingWorkout ? "Ending..." : "Confirm"}
											</Button>
										</div>
									</div>
								) : (
									<Button
										type="button"
										variant="ghost"
										onClick={() => {
											setEndWorkoutConfirm(true);
											setEndCycleConfirm(false);
										}}
										className="w-full"
									>
										End workout
									</Button>
								)}
							</div>
						</>
					) : (
						<Button
							type="button"
							onClick={handleStart}
							disabled={isStarting}
							className="w-full"
						>
							{isStarting ? "Starting..." : "Start workout"}
						</Button>
					)}

					<div className="mt-6 pt-6 border-t border-border">
						{endCycleConfirm ? (
							<div>
								<p className="text-sm text-muted-foreground mb-3">
									Are you sure? This will end your current cycle.
								</p>
								<div className="flex gap-3">
									<Button
										type="button"
										variant="secondary"
										onClick={() => setEndCycleConfirm(false)}
										disabled={isEnding}
										className="flex-1"
									>
										Cancel
									</Button>
									<Button
										type="button"
										variant="destructive"
										onClick={handleEndCycle}
										disabled={isEnding}
										className="flex-1"
									>
										{isEnding ? "Ending..." : "Confirm"}
									</Button>
								</div>
							</div>
						) : (
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setEndCycleConfirm(true);
									setEndWorkoutConfirm(false);
								}}
								className="w-full"
							>
								End cycle
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
