import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface WorkoutCompleteProps {
	setsCompleted: number;
	totalSets: number;
	mainLift: string;
	startedAt: string | null;
	isFinishing: boolean;
	onFinish: () => void;
}

const LIFT_DISPLAY_NAMES: Record<string, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

function formatDuration(startedAt: string | null): string {
	if (!startedAt) return "--";
	const ms = Math.max(0, Date.now() - new Date(startedAt).getTime());
	const totalMinutes = Math.floor(ms / 60000);
	if (totalMinutes < 60) return `${totalMinutes} min`;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

export function WorkoutComplete({
	setsCompleted,
	totalSets,
	mainLift,
	startedAt,
	isFinishing,
	onFinish,
}: WorkoutCompleteProps) {
	const skipped = totalSets - setsCompleted;
	const liftName = LIFT_DISPLAY_NAMES[mainLift] ?? mainLift;
	const duration = formatDuration(startedAt);

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 px-4">
			{/* Achievement header */}
			<div className="text-center space-y-3">
				<p className="text-5xl" aria-hidden="true">
					&#10003;
				</p>
				<h1 className="text-5xl font-bold tracking-tight text-foreground">
					Done.
				</h1>
				<p className="text-muted-foreground text-lg">{liftName} day complete</p>
			</div>

			{/* Summary card */}
			<Card className="w-full max-w-sm">
				<CardContent className="p-6 space-y-5">
					<div className="flex justify-between items-baseline">
						<span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
							Sets
						</span>
						<span className="font-mono text-2xl font-bold text-foreground">
							{setsCompleted} / {totalSets}
						</span>
					</div>

					{skipped > 0 && (
						<div className="flex justify-between items-baseline">
							<span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
								Skipped
							</span>
							<Badge variant="secondary" className="font-mono">
								{skipped} {skipped === 1 ? "set" : "sets"}
							</Badge>
						</div>
					)}

					<div className="flex justify-between items-baseline">
						<span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
							Duration
						</span>
						<span className="font-mono text-2xl font-bold text-foreground">
							{duration}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* CTA */}
			<Button
				type="button"
				onClick={onFinish}
				disabled={isFinishing}
				size="lg"
				className="w-full max-w-sm min-h-16 text-lg"
			>
				{isFinishing ? "Finishing..." : "Done"}
			</Button>
		</div>
	);
}
