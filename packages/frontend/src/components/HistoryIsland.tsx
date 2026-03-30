import { useAtomValue } from "@effect/atom-react";
import { DAY_NAMES } from "@powercycle/shared/schema/program";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { workoutHistoryAtom } from "../atoms/workouts";

function getDayName(day: number): string {
	const names: Record<number, string> = DAY_NAMES;
	return names[day] ?? "Unknown";
}

export default function HistoryIsland() {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const result = useAtomValue(workoutHistoryAtom);

	if (AsyncResult.isInitial(result) || result.waiting) {
		return <p className="text-neutral-400">Loading history...</p>;
	}

	if (AsyncResult.isFailure(result)) {
		return <p className="text-red-400">Failed to load workout history.</p>;
	}

	const workouts = (result.value ?? []).filter((w) => w.completedAt !== null);

	if (workouts.length === 0) {
		return (
			<div>
				<h1 className="text-2xl font-semibold text-neutral-100 mb-4">
					Workout history
				</h1>
				<p className="text-neutral-400">No completed workouts yet.</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-semibold text-neutral-100 mb-6">
				Workout history
			</h1>
			<div className="space-y-3">
				{workouts.map((workout) => (
					<div
						key={workout.id}
						className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
					>
						<button
							type="button"
							onClick={() =>
								setExpandedId(expandedId === workout.id ? null : workout.id)
							}
							className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-neutral-800/50"
						>
							<div>
								<p className="font-semibold text-lg text-neutral-100">
									{getDayName(workout.day)} Day
								</p>
								<p className="text-sm text-neutral-500">
									Round {workout.round} —{" "}
									{new Date(workout.startedAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="bg-neutral-800 text-neutral-300 rounded-md px-2 py-0.5 text-xs font-mono">
									{workout.sets?.length ?? 0} sets
								</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-label="Toggle details"
									role="img"
									className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${expandedId === workout.id ? "rotate-180" : ""}`}
								>
									<path
										fillRule="evenodd"
										d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
						</button>
						{expandedId === workout.id && workout.sets && (
							<div className="border-t border-neutral-800 p-4 space-y-2">
								{workout.sets.map((set) => (
									<div
										key={`${set.exerciseName}-${String(set.setNumber)}`}
										className="flex items-center justify-between text-sm"
									>
										<span className="text-neutral-300">
											{set.exerciseName} — Set {set.setNumber}
										</span>
										<span className="font-mono text-neutral-400">
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
