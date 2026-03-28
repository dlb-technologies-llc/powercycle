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
	lastCompletedSetData?: { weight: string; reps: string; rpe: string };
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
	const isWrapFrame = seconds % 60 === 0 && seconds > 0;
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
				className={
					isWrapFrame ? "" : "transition-all duration-1000 ease-linear"
				}
			/>
		</svg>
	);
}

function getDefaultWeight(
	set: FlatSet,
	preferredWeight?: number,
	lastCompletedSetData?: { weight: string },
): string {
	if (lastCompletedSetData?.weight) {
		return lastCompletedSetData.weight;
	}
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

function getDefaultReps(
	set: FlatSet,
	lastCompletedSetData?: { reps: string },
): string {
	if (lastCompletedSetData?.reps) {
		return lastCompletedSetData.reps;
	}
	if (set.isMainLift && set.prescribed.reps != null) {
		return String(set.prescribed.reps);
	}
	if (set.lastSession?.reps != null) {
		return String(set.lastSession.reps);
	}
	return "";
}

function getDefaultRpe(
	set: FlatSet,
	lastCompletedSetData?: { rpe: string },
): string {
	if (lastCompletedSetData?.rpe) {
		return lastCompletedSetData.rpe;
	}
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
	nextExerciseName,
	unit,
	preferredWeight,
	lastCompletedSetData,
	progress,
	onStartSet,
	onDone,
	onConfirmAndNext,
}: ActiveSetViewProps) {
	const [weight, setWeight] = useState<string>(
		getDefaultWeight(set, preferredWeight, lastCompletedSetData),
	);
	const [reps, setReps] = useState<string>(
		getDefaultReps(set, lastCompletedSetData),
	);
	const [rpe, setRpe] = useState<string>(
		getDefaultRpe(set, lastCompletedSetData),
	);
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
		const currentSetNumber = completedSetsForExercise + 1;
		const totalSets = allSetsForExercise.length;

		return (
			<div className="flex flex-col items-center text-center space-y-6 animate-fade-in min-h-[70vh] justify-center">
				<div className="space-y-2">
					<h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-heading)] uppercase gradient-text-cyan font-bold">
						{set.exerciseName}
					</h2>
					<p className="font-[family-name:var(--font-heading)] text-sm sm:text-base uppercase tracking-wider text-zinc-400">
						Set {currentSetNumber} of {totalSets}
					</p>
					<p className="font-[family-name:var(--font-mono)] text-lg text-zinc-300">
						{set.isMainLift
							? `${set.prescribed.weight ?? "—"} ${unit} × ${set.prescribed.reps ?? "—"}`
							: `${set.prescribed.repMin ?? "—"}-${set.prescribed.repMax ?? "—"} reps @ RPE ${set.prescribed.rpeMin ?? "—"}-${set.prescribed.rpeMax ?? "—"}`}
					</p>
					{set.isAmrap && (
						<span className="inline-block text-xs font-bold bg-red-500/20 text-red-400 rounded-full px-3 py-1 uppercase tracking-wider">
							AMRAP
						</span>
					)}
				</div>

				<div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 flex items-center justify-center">
					<TimerRing seconds={setTimerSeconds} color="cyan" />
					<span className="text-7xl sm:text-8xl lg:text-9xl font-[family-name:var(--font-mono)] text-white animate-timer-pulse">
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
		const currentSetNumber = completedSetsForExercise + 1;
		const showUpNext =
			!isLastSet &&
			nextExerciseName != null &&
			nextExerciseName !== set.exerciseName;

		return (
			<div className="flex flex-col items-center space-y-6 animate-fade-in">
				<div className="text-center space-y-2">
					<h2 className="text-3xl sm:text-4xl font-[family-name:var(--font-heading)] uppercase gradient-text-cyan font-bold">
						{set.exerciseName}
					</h2>
					<p className="font-[family-name:var(--font-heading)] text-sm sm:text-base uppercase tracking-wider text-amber-400">
						Set {currentSetNumber}
					</p>
					{set.isMainLift ? (
						<p className="font-[family-name:var(--font-mono)] text-sm text-zinc-400">
							Completed: {set.prescribed.weight ?? "—"} {unit} ×{" "}
							{set.prescribed.reps ?? "—"}
						</p>
					) : (
						<div className="space-y-1">
							<p className="text-sm text-zinc-400">
								Record the weight you used. Adjust for your next set if needed.
							</p>
							{hasRpe && (
								<p className="text-sm text-amber-400/80">
									Target RPE: {set.prescribed.rpeMin}-{set.prescribed.rpeMax}.
									Felt easy? Consider increasing weight next set.
								</p>
							)}
						</div>
					)}
				</div>

				<div className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64 flex items-center justify-center">
					<TimerRing seconds={restTimerSeconds} color="amber" />
					<span className="text-6xl sm:text-7xl font-[family-name:var(--font-mono)] text-amber-400 animate-glow-amber">
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
							inputMode="decimal"
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
							inputMode="numeric"
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
								inputMode="numeric"
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

					{showUpNext && (
						<p className="text-center text-sm text-zinc-500 font-[family-name:var(--font-heading)]">
							Up next: {nextExerciseName}
						</p>
					)}

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
