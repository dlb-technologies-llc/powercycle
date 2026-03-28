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
		return <p className="text-zinc-400">Loading history...</p>;
	}

	if (AsyncResult.isFailure(result)) {
		return <p className="text-red-400">Failed to load workout history.</p>;
	}

	const workouts = (result.value ?? []).filter((w) => w.completedAt !== null);

	if (workouts.length === 0) {
		return (
			<div>
				<h1 className="text-2xl font-[family-name:var(--font-heading)] uppercase tracking-wider gradient-text-cyan mb-4">
					Workout History
				</h1>
				<p className="text-zinc-400">No completed workouts yet.</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-[family-name:var(--font-heading)] uppercase tracking-wider gradient-text-cyan mb-6">
				Workout History
			</h1>
			<div className="space-y-3">
				{workouts.map((workout, index) => (
					<div
						key={workout.id}
						className="glass-card overflow-hidden animate-fade-in"
						style={{ animationDelay: `${index * 80}ms` }}
					>
						<button
							type="button"
							onClick={() =>
								setExpandedId(expandedId === workout.id ? null : workout.id)
							}
							className="w-full p-4 flex items-center justify-between text-left"
						>
							<div>
								<p className="font-[family-name:var(--font-heading)] text-lg">
									{getDayName(workout.day)} Day
								</p>
								<p className="text-sm text-zinc-500">
									Round {workout.round} —{" "}
									{new Date(workout.startedAt).toLocaleDateString()}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-[family-name:var(--font-mono)] bg-zinc-800 rounded-full px-2 py-0.5 text-zinc-400">
									{workout.sets?.length ?? 0} sets
								</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									aria-label="Toggle details"
									role="img"
									className={`w-5 h-5 text-zinc-500 transition-transform duration-300 ${expandedId === workout.id ? "rotate-180" : ""}`}
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
							<div className="border-t border-zinc-800/50 p-4 space-y-2">
								{workout.sets.map((set) => (
									<div
										key={`${set.exerciseName}-${String(set.setNumber)}`}
										className="flex items-center justify-between text-sm"
									>
										<span className="text-zinc-300">
											{set.exerciseName} — Set {set.setNumber}
										</span>
										<span className="font-[family-name:var(--font-mono)] text-zinc-400">
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
