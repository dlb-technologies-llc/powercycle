import { useState } from "react";
import type { FlatSet, WorkoutPhase } from "../hooks/useWorkoutFlow";

interface ActiveSetViewProps {
	set: FlatSet;
	phase: WorkoutPhase;
	setTimerSeconds: number;
	restTimerSeconds: number;
	isLastSet: boolean;
	nextExerciseName: string | null;
	unit: string;
	preferredWeight?: number;
	onStartSet: () => void;
	onDone: () => void;
	onConfirm: (data: {
		actualWeight: number | null;
		actualReps: number;
		rpe: number | null;
	}) => void;
	onStartNextSet: () => void;
}

function formatTime(s: number): string {
	const mins = Math.floor(s / 60);
	const secs = s % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function prescribedDisplay(set: FlatSet, unit: string): string {
	if (set.isMainLift) {
		return `${set.prescribed.weight} ${unit} \u00d7 ${set.prescribed.reps}${set.isAmrap ? "+" : ""}`;
	}
	return `${set.prescribed.repMin}-${set.prescribed.repMax} reps @ RPE ${set.prescribed.rpeMin}-${set.prescribed.rpeMax}`;
}

export function ActiveSetView({
	set,
	phase,
	setTimerSeconds,
	restTimerSeconds,
	isLastSet: _isLastSet,
	nextExerciseName,
	unit,
	preferredWeight,
	onStartSet,
	onDone,
	onConfirm,
	onStartNextSet,
}: ActiveSetViewProps) {
	const [weight, setWeight] = useState<string>(
		set.isMainLift && set.prescribed.weight != null
			? String(set.prescribed.weight)
			: preferredWeight != null
				? String(preferredWeight)
				: "",
	);
	const [reps, setReps] = useState<string>(
		set.isMainLift && set.prescribed.reps != null
			? String(set.prescribed.reps)
			: "",
	);
	const [rpe, setRpe] = useState<string>("");

	const hasRpe = set.prescribed.rpeMin != null && set.prescribed.rpeMax != null;

	if (phase === "ready") {
		return (
			<div className="flex flex-col items-center text-center space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-zinc-100">
						{set.exerciseName}
					</h2>
					<p className="text-zinc-400 mt-1">Set {set.setNumber}</p>
					<p className="text-zinc-300 mt-2">{prescribedDisplay(set, unit)}</p>
					{set.isAmrap && (
						<span className="inline-block mt-2 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
							AMRAP
						</span>
					)}
				</div>
				<button
					type="button"
					onClick={onStartSet}
					className="w-full min-h-16 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-500 transition-colors"
				>
					START SET
				</button>
			</div>
		);
	}

	if (phase === "active") {
		return (
			<div className="flex flex-col items-center text-center space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-zinc-100">
						{set.exerciseName}
					</h2>
					<p className="text-zinc-400 mt-1">Set {set.setNumber}</p>
				</div>
				<p className="text-5xl font-mono text-zinc-100">
					{formatTime(setTimerSeconds)}
				</p>
				<button
					type="button"
					onClick={onDone}
					className="w-full min-h-16 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-500 transition-colors"
				>
					DONE
				</button>
			</div>
		);
	}

	if (phase === "logging") {
		return (
			<div className="flex flex-col items-center text-center space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-zinc-100">
						{set.exerciseName}
					</h2>
					<p className="text-zinc-400 mt-1">Set {set.setNumber}</p>
				</div>
				<div className="w-full space-y-4">
					<label className="block">
						<span className="block text-sm text-zinc-400 mb-1 text-left">
							Weight ({unit})
						</span>
						<input
							type="number"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
							className="w-full text-xl bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
							placeholder="Weight"
						/>
						{!set.isMainLift && preferredWeight != null && (
							<span className="text-xs text-zinc-500">
								Last: {preferredWeight} {unit}
							</span>
						)}
					</label>
					<label className="block">
						<span className="block text-sm text-zinc-400 mb-1 text-left">
							Reps
						</span>
						<input
							type="number"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
							className="w-full text-xl bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
							placeholder="Reps"
						/>
					</label>
					{hasRpe && (
						<label className="block">
							<span className="block text-sm text-zinc-400 mb-1 text-left">
								RPE (target: {set.prescribed.rpeMin}-{set.prescribed.rpeMax})
							</span>
							<input
								type="number"
								value={rpe}
								onChange={(e) => setRpe(e.target.value)}
								className="w-full text-xl bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
								placeholder="RPE"
							/>
						</label>
					)}
				</div>
				<button
					type="button"
					disabled={!reps}
					onClick={() =>
						onConfirm({
							actualWeight: weight ? Number(weight) : null,
							actualReps: Number(reps),
							rpe: rpe ? Number(rpe) : null,
						})
					}
					className="w-full min-h-[48px] bg-zinc-100 text-zinc-900 text-lg font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-40 transition-colors"
				>
					CONFIRM
				</button>
			</div>
		);
	}

	if (phase === "resting") {
		return (
			<div className="flex flex-col items-center text-center space-y-6">
				<p className="text-5xl font-mono text-zinc-300">
					{formatTime(restTimerSeconds)}
				</p>
				<button
					type="button"
					onClick={onStartNextSet}
					className="w-full min-h-16 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-500 transition-colors"
				>
					NEXT SET
				</button>
			</div>
		);
	}

	if (phase === "exercise-break") {
		return (
			<div className="flex flex-col items-center text-center space-y-6">
				<div>
					<p className="text-zinc-400">Next up:</p>
					<h2 className="text-2xl font-bold text-zinc-100">
						{nextExerciseName}
					</h2>
				</div>
				<p className="text-4xl font-mono text-zinc-300">
					{formatTime(restTimerSeconds)}
				</p>
				<button
					type="button"
					onClick={onStartNextSet}
					className="w-full min-h-16 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-500 transition-colors"
				>
					BEGIN
				</button>
			</div>
		);
	}

	return null;
}
