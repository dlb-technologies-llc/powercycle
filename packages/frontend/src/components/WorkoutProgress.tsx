interface WorkoutProgressProps {
	current: number;
	total: number;
}

export function WorkoutProgress({ current, total }: WorkoutProgressProps) {
	const pct = total > 0 ? (current / total) * 100 : 0;
	return (
		<div className="space-y-1">
			<div className="flex justify-between text-sm text-zinc-400">
				<span>
					Set {current} of {total}
				</span>
				<span>{Math.round(pct)}%</span>
			</div>
			<div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
				<div
					className="h-full bg-green-600 rounded-full transition-all duration-300"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
