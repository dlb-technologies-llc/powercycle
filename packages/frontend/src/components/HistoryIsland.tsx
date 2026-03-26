import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { workoutHistoryAtom } from "../atoms/workouts";

const DAY_NAMES: Record<number, string> = {
	1: "Squat",
	2: "Bench Press",
	3: "Deadlift",
	4: "Overhead Press",
};

interface WorkoutSet {
	readonly exerciseName: string;
	readonly setNumber: number;
	readonly actualWeight: number | null;
	readonly actualReps: number | null;
	readonly rpe: number | null;
	readonly isMainLift: boolean;
}

interface Workout {
	readonly id: string;
	readonly round: number;
	readonly day: number;
	readonly startedAt: string;
	readonly completedAt: string | null;
	readonly sets: readonly WorkoutSet[];
}

export default function HistoryIsland() {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const result = useAtomValue(workoutHistoryAtom);

	if (AsyncResult.isInitial(result) || result.waiting) {
		return <p className="text-zinc-400">Loading history...</p>;
	}

	if (AsyncResult.isFailure(result)) {
		return <p className="text-red-400">Failed to load workout history.</p>;
	}

	const workouts = ((result.value ?? []) as readonly Workout[]).filter(
		(w) => w.completedAt !== null,
	);

	if (workouts.length === 0) {
		return (
			<div>
				<h1 className="text-2xl font-bold mb-4">Workout History</h1>
				<p className="text-zinc-400">No completed workouts yet.</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Workout History</h1>
			<div className="space-y-3">
				{workouts.map((workout) => (
					<div
						key={workout.id}
						className="bg-zinc-900 rounded-lg overflow-hidden"
					>
						<button
							type="button"
							onClick={() =>
								setExpandedId(expandedId === workout.id ? null : workout.id)
							}
							className="w-full p-4 flex items-center justify-between text-left"
						>
							<div>
								<p className="font-medium">
									{DAY_NAMES[workout.day] ?? "Unknown"} Day
								</p>
								<p className="text-sm text-zinc-400">
									Round {workout.round} —{" "}
									{new Date(workout.startedAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-zinc-500">
									{workout.sets?.length ?? 0} sets
								</span>
								<span className="text-zinc-500">
									{expandedId === workout.id ? "\u25B2" : "\u25BC"}
								</span>
							</div>
						</button>
						{expandedId === workout.id && workout.sets && (
							<div className="border-t border-zinc-800 p-4 space-y-2">
								{workout.sets.map((set) => (
									<div
										key={`${set.exerciseName}-${String(set.setNumber)}`}
										className="flex items-center justify-between text-sm"
									>
										<span className="text-zinc-300">
											{set.exerciseName} — Set {set.setNumber}
										</span>
										<span className="text-zinc-400">
											{set.actualWeight != null ? `${set.actualWeight} ` : ""}
											{set.actualReps != null ? `x${set.actualReps}` : ""}
											{set.rpe != null ? ` @ RPE ${set.rpe}` : ""}
										</span>
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
