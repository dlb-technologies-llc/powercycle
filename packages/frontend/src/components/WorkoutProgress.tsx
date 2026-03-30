import { Progress } from "@/components/ui/progress";

interface WorkoutProgressProps {
	current: number;
	total: number;
	exerciseName?: string;
}

export function WorkoutProgress({
	current,
	total,
	exerciseName,
}: WorkoutProgressProps) {
	const pct = total > 0 ? (current / total) * 100 : 0;
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium text-black">
					Set {current} of {total}
				</span>
				{exerciseName && <span className="badge">{exerciseName}</span>}
			</div>
			<Progress value={pct} />
		</div>
	);
}
