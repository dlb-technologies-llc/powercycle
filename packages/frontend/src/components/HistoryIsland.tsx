import { useAtomValue } from "@effect/atom-react";
import { DAY_NAMES } from "@powercycle/shared/schema/program";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { workoutHistoryAtom } from "../atoms/workouts";

function getDayName(day: number): string {
	const names: Record<number, string> = DAY_NAMES;
	return names[day] ?? "Unknown";
}

export default function HistoryIsland() {
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const result = useAtomValue(workoutHistoryAtom);

	if (AsyncResult.isInitial(result) || result.waiting) {
		return <p className="text-muted-foreground">Loading history...</p>;
	}

	if (AsyncResult.isFailure(result)) {
		return <p className="text-destructive">Failed to load workout history.</p>;
	}

	const workouts = (result.value ?? []).filter((w) => w.completedAt !== null);

	if (workouts.length === 0) {
		return (
			<div>
				<h1 className="text-2xl font-bold text-foreground mb-4">
					Workout history
				</h1>
				<p className="text-muted-foreground">No completed workouts yet.</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold text-foreground mb-6">
				Workout history
			</h1>
			<div className="space-y-3">
				{workouts.map((workout) => (
					<Collapsible
						key={workout.id}
						open={expandedId === workout.id}
						onOpenChange={(open) => setExpandedId(open ? workout.id : null)}
					>
						<Card className="p-0 overflow-hidden">
							<CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-accent/50">
								<div>
									<p className="font-semibold text-lg text-foreground">
										{getDayName(workout.day)} Day
									</p>
									<p className="text-sm text-muted-foreground">
										Round {workout.round} —{" "}
										{new Date(workout.startedAt).toLocaleDateString()}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="font-mono">
										{workout.sets?.length ?? 0} sets
									</Badge>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-label="Toggle details"
										role="img"
										className={cn(
											"w-5 h-5 text-muted-foreground transition-transform duration-300",
											expandedId === workout.id && "rotate-180",
										)}
									>
										<path
											fillRule="evenodd"
											d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<CardContent className="border-t p-4 space-y-2">
									{workout.sets?.map((set) => (
										<div
											key={`${set.exerciseName}-${String(set.setNumber)}`}
											className="flex items-center justify-between text-sm"
										>
											<span className="text-foreground">
												{set.exerciseName} — Set {set.setNumber}
											</span>
											<span className="flex items-center gap-2">
												{set.skipped && (
													<Badge variant="destructive">Skipped</Badge>
												)}
												<span className="font-mono text-muted-foreground">
													{set.actualWeight != null
														? `${set.actualWeight} `
														: ""}
													{set.actualReps != null ? `x${set.actualReps}` : ""}
													{set.rpe != null ? ` @ RPE ${set.rpe}` : ""}
												</span>
											</span>
										</div>
									))}
								</CardContent>
							</CollapsibleContent>
						</Card>
					</Collapsible>
				))}
			</div>
		</div>
	);
}
