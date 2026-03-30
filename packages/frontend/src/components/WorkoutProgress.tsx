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
			<div className="text-sm text-neutral-400">
				Set {current} of {total}
			</div>
			<div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
				<div
					className="h-full bg-indigo-500 rounded-full transition-all duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>
			{exerciseName && (
				<div className="text-xs text-neutral-500">{exerciseName}</div>
			)}
		</div>
	);
}
