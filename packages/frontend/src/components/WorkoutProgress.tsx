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
			<div className="text-sm text-zinc-400">
				Set {current} of {total}
			</div>
			<div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-300"
					style={{
						width: `${pct}%`,
						background: "linear-gradient(90deg, #06b6d4, #3b82f6)",
					}}
				/>
			</div>
			{exerciseName && (
				<div className="text-xs text-zinc-500">{exerciseName}</div>
			)}
		</div>
	);
}
