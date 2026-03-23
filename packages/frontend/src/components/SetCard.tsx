import { useState } from "react";

interface SetCardProps {
	setNumber: number;
	prescribedWeight?: number;
	prescribedReps?: number;
	rpeTarget?: string;
	repRange?: string;
	isAmrap?: boolean;
	unit?: string;
	onComplete: (data: {
		actualWeight?: number;
		actualReps: number;
		rpe?: number;
	}) => void;
}

export function SetCard({
	setNumber,
	prescribedWeight,
	prescribedReps,
	rpeTarget,
	repRange,
	isAmrap,
	unit = "lbs",
	onComplete,
}: SetCardProps) {
	const [completed, setCompleted] = useState(false);
	const [weight, setWeight] = useState(prescribedWeight?.toString() ?? "");
	const [reps, setReps] = useState(prescribedReps?.toString() ?? "");
	const [rpe, setRpe] = useState("");
	const [editing, setEditing] = useState(false);

	const handleDone = () => {
		if (!completed) {
			setEditing(true);
			setCompleted(true);
		}
	};

	const handleConfirm = () => {
		onComplete({
			actualWeight: weight ? Number(weight) : undefined,
			actualReps: Number(reps) || 0,
			rpe: rpe ? Number(rpe) : undefined,
		});
		setEditing(false);
	};

	if (completed && !editing) {
		return (
			<div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 opacity-60">
				<div className="flex items-center justify-between">
					<span className="text-sm text-zinc-400">Set {setNumber}</span>
					<span className="text-green-400 text-sm font-medium">Done</span>
				</div>
				<p className="text-zinc-300 mt-1">
					{weight && `${weight} ${unit} `}x {reps}
					{rpe && ` @ RPE ${rpe}`}
				</p>
			</div>
		);
	}

	if (editing) {
		return (
			<div className="bg-zinc-900 border border-zinc-600 rounded-lg p-4 space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-zinc-400">Set {setNumber}</span>
					{isAmrap && (
						<span className="text-amber-400 text-xs font-medium">AMRAP</span>
					)}
				</div>
				<div className="grid grid-cols-2 gap-3">
					<label className="text-xs text-zinc-500 block">
						Weight ({unit})
						<input
							type="number"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
							className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 text-lg"
						/>
					</label>
					<label className="text-xs text-zinc-500 block">
						Reps
						<input
							type="number"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
							className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 text-lg"
						/>
					</label>
				</div>
				{rpeTarget && (
					<label className="text-xs text-zinc-500 block">
						RPE (target: {rpeTarget})
						<input
							type="number"
							min="1"
							max="10"
							step="0.5"
							value={rpe}
							onChange={(e) => setRpe(e.target.value)}
							placeholder={rpeTarget.replace("RPE ", "")}
							className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100 text-lg"
						/>
					</label>
				)}
				<button
					type="button"
					onClick={handleConfirm}
					className="w-full py-2 bg-zinc-100 text-zinc-900 font-semibold rounded hover:bg-zinc-200 transition-colors"
				>
					Confirm
				</button>
			</div>
		);
	}

	return (
		<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
			<div className="flex items-center justify-between">
				<div>
					<span className="text-sm text-zinc-400">Set {setNumber}</span>
					{isAmrap && (
						<span className="ml-2 text-amber-400 text-xs font-medium">
							AMRAP
						</span>
					)}
				</div>
			</div>
			<div className="flex items-center justify-between mt-2">
				<div className="text-xl font-bold">
					{prescribedWeight ? (
						<>
							{prescribedWeight} {unit} x {prescribedReps}
							{isAmrap ? "+" : ""}
						</>
					) : (
						<span className="text-zinc-400 text-base">
							{repRange ?? "\u2014"} {rpeTarget && `@ ${rpeTarget}`}
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={handleDone}
					className="px-6 py-2 bg-zinc-100 text-zinc-900 font-bold rounded-lg hover:bg-zinc-200 transition-colors"
				>
					DONE
				</button>
			</div>
		</div>
	);
}
