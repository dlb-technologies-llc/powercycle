import { useState } from "react";
import type { FlatSet, WorkoutPhase } from "../hooks/useWorkoutFlow";
import { WorkoutProgress } from "./WorkoutProgress";

interface ActiveSetViewProps {
	set: FlatSet;
	phase: WorkoutPhase;
	setTimerSeconds: number;
	restTimerSeconds: number;
	isLastSet: boolean;
	isExerciseTransition: boolean;
	allSetsForExercise: FlatSet[];
	completedSetsForExercise: number;
	nextExerciseName: string | null;
	unit: string;
	preferredWeight?: number;
	progress: { current: number; total: number };
	onStartSet: () => void;
	onDone: () => void;
	onConfirmAndNext: (data: {
		actualWeight: number | null;
		actualReps: number;
		rpe: number | null;
		saveWeight?: boolean;
	}) => void;
}

function formatTime(s: number): string {
	const mins = Math.floor(s / 60);
	const secs = s % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TimerRing({
	seconds,
	color,
}: {
	seconds: number;
	color: "cyan" | "amber";
}) {
	const circumference = 2 * Math.PI * 90;
	const progress = (seconds % 60) / 60;
	const dashOffset = circumference * (1 - progress);
	const strokeColor = color === "cyan" ? "#06b6d4" : "#f59e0b";
	return (
		<svg
			className="absolute inset-0 w-full h-full -rotate-90"
			viewBox="0 0 200 200"
			role="img"
			aria-label="Timer progress ring"
		>
			<circle
				cx="100"
				cy="100"
				r="90"
				fill="none"
				stroke="rgba(63,63,70,0.3)"
				strokeWidth="4"
			/>
			<circle
				cx="100"
				cy="100"
				r="90"
				fill="none"
				stroke={strokeColor}
				strokeWidth="4"
				strokeDasharray={circumference}
				strokeDashoffset={dashOffset}
				strokeLinecap="round"
				className="transition-all duration-1000 ease-linear"
			/>
		</svg>
	);
}

function getDefaultWeight(set: FlatSet, preferredWeight?: number): string {
	if (set.isMainLift && set.prescribed.weight != null) {
		return String(set.prescribed.weight);
	}
	if (set.lastSession?.weight != null) {
		return String(set.lastSession.weight);
	}
	if (preferredWeight != null) {
		return String(preferredWeight);
	}
	return "";
}

function getDefaultReps(set: FlatSet): string {
	if (set.isMainLift && set.prescribed.reps != null) {
		return String(set.prescribed.reps);
	}
	if (set.lastSession?.reps != null) {
		return String(set.lastSession.reps);
	}
	return "";
}

function getDefaultRpe(set: FlatSet): string {
	if (set.lastSession?.rpe != null) {
		return String(set.lastSession.rpe);
	}
	return "";
}

export function ActiveSetView({
	set,
	phase,
	setTimerSeconds,
	restTimerSeconds,
	isLastSet,
	isExerciseTransition,
	allSetsForExercise,
	completedSetsForExercise,
	nextExerciseName: _nextExerciseName,
	unit,
	preferredWeight,
	progress,
	onStartSet,
	onDone,
	onConfirmAndNext,
}: ActiveSetViewProps) {
	const [weight, setWeight] = useState<string>(
		getDefaultWeight(set, preferredWeight),
	);
	const [reps, setReps] = useState<string>(getDefaultReps(set));
	const [rpe, setRpe] = useState<string>(getDefaultRpe(set));
	const [saveWeight, setSaveWeight] = useState(true);

	const hasRpe = set.prescribed.rpeMin != null && set.prescribed.rpeMax != null;
	const rpeValue = rpe ? Number(rpe) : null;
	const rpeError =
		rpeValue !== null && (rpeValue < 1 || rpeValue > 10)
			? "RPE must be 1-10"
			: null;

	// Is this the last set of a non-main-lift exercise?
	const isLastSetOfAccessory =
		!set.isMainLift &&
		completedSetsForExercise + 1 === allSetsForExercise.length;

	if (phase === "ready") {
		return (
			<div className="flex flex-col items-center text-center space-y-6 animate-fade-in">
				{isExerciseTransition && (
					<span className="text-amber-400 uppercase tracking-widest font-[family-name:var(--font-heading)] text-sm font-bold">
						Next Up
					</span>
				)}
				<h2 className="text-4xl font-[family-name:var(--font-heading)] uppercase gradient-text-cyan font-bold">
					{set.exerciseName}
				</h2>

				<div className="glass-card p-4 w-full space-y-2">
					{allSetsForExercise.map((s, idx) => {
						const isCurrent = idx === completedSetsForExercise;
						return (
							<div
								key={s.setNumber}
								className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${
									isCurrent
										? "border-l-2 border-cyan-500 bg-cyan-500/5"
										: "text-zinc-400"
								}`}
							>
								<span
									className={`font-[family-name:var(--font-mono)] ${isCurrent ? "text-zinc-100" : ""}`}
								>
									{s.isMainLift
										? `Set ${s.setNumber}: ${s.prescribed.weight} ${unit} × ${s.prescribed.reps}${s.isAmrap ? "+" : ""}`
										: `Set ${s.setNumber}: ${s.prescribed.repMin}-${s.prescribed.repMax} reps @ RPE ${s.prescribed.rpeMin}-${s.prescribed.rpeMax}`}
								</span>
								{s.isAmrap && (
									<span className="text-xs bg-red-500/20 text-red-400 rounded px-2 py-0.5">
										AMRAP
									</span>
								)}
							</div>
						);
					})}
				</div>

				{set.lastSession?.weight != null && (
					<p className="text-cyan-400 font-[family-name:var(--font-mono)] text-sm">
						Last session: {set.lastSession.weight} {unit}
					</p>
				)}

				<button
					type="button"
					onClick={onStartSet}
					className="btn-gradient-cyan min-h-20 rounded-2xl text-xl w-full"
				>
					Start Set
				</button>
			</div>
		);
	}

	if (phase === "active") {
		return (
			<div className="flex flex-col items-center text-center space-y-6 animate-fade-in min-h-[70vh] justify-center">
				<div>
					<p className="font-[family-name:var(--font-heading)] text-sm text-zinc-500 uppercase tracking-[0.3em]">
						Set Timer
					</p>
					<p className="text-zinc-400 text-sm mt-1">
						{set.exerciseName} &middot; Set {set.setNumber}
					</p>
				</div>

				<div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
					<TimerRing seconds={setTimerSeconds} color="cyan" />
					<span className="text-7xl sm:text-8xl font-[family-name:var(--font-mono)] text-white animate-timer-pulse">
						{formatTime(setTimerSeconds)}
					</span>
				</div>

				<div className="w-full mt-auto">
					<button
						type="button"
						onClick={onDone}
						className="btn-gradient-green min-h-20 rounded-2xl text-xl w-full"
					>
						Done
					</button>
				</div>
			</div>
		);
	}

	if (phase === "resting") {
		return (
			<div className="flex flex-col items-center space-y-6 animate-fade-in">
				<div className="text-center">
					<p className="font-[family-name:var(--font-heading)] text-sm text-amber-400 uppercase tracking-[0.3em]">
						Rest Timer
					</p>
				</div>

				<div className="relative w-44 h-44 flex items-center justify-center">
					<TimerRing seconds={restTimerSeconds} color="amber" />
					<span className="text-6xl font-[family-name:var(--font-mono)] text-amber-400 animate-glow-amber">
						{formatTime(restTimerSeconds)}
					</span>
				</div>

				<div className="glass-card p-4 w-full space-y-4">
					<label className="block">
						<span className="block text-sm text-zinc-400 mb-1 text-left">
							Weight ({unit})
						</span>
						<input
							type="number"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
							className="w-full text-xl font-[family-name:var(--font-mono)] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-amber-500 focus:ring-1 focus:outline-none"
							placeholder="Weight"
						/>
					</label>
					<label className="block">
						<span className="block text-sm text-zinc-400 mb-1 text-left">
							Reps
						</span>
						<input
							type="number"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
							className="w-full text-xl font-[family-name:var(--font-mono)] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-amber-500 focus:ring-1 focus:outline-none"
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
								min={1}
								max={10}
								step={0.5}
								value={rpe}
								onChange={(e) => setRpe(e.target.value)}
								className="w-full text-xl font-[family-name:var(--font-mono)] bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-amber-500 focus:ring-1 focus:outline-none"
								placeholder="RPE"
							/>
							{rpeError && (
								<span className="text-red-400 text-xs mt-1 block">
									{rpeError}
								</span>
							)}
						</label>
					)}

					{isLastSetOfAccessory && (
						<label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
							<input
								type="checkbox"
								checked={saveWeight}
								onChange={(e) => setSaveWeight(e.target.checked)}
								className="rounded border-zinc-700 bg-zinc-800"
							/>
							Save weight for next time?
						</label>
					)}
				</div>

				<div className="w-full space-y-3">
					<WorkoutProgress
						current={progress.current}
						total={progress.total}
						exerciseName={set.exerciseName}
					/>
					<button
						type="button"
						disabled={!reps}
						onClick={() =>
							onConfirmAndNext({
								actualWeight: weight ? Number(weight) : null,
								actualReps: Number(reps),
								rpe: rpe ? Number(rpe) : null,
								saveWeight: isLastSetOfAccessory ? saveWeight : undefined,
							})
						}
						className={`${isLastSet ? "btn-gradient-green" : "btn-gradient-cyan"} min-h-20 rounded-2xl text-xl w-full disabled:opacity-40`}
					>
						{isLastSet ? "Finish" : "Next Set"}
					</button>
				</div>
			</div>
		);
	}

	return null;
}
