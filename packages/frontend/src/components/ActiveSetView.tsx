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

function TimerRing({ seconds }: { seconds: number }) {
	const circumference = 2 * Math.PI * 90;
	const progress = (seconds % 60) / 60;
	const dashOffset = circumference * (1 - progress);
	// Disable CSS transition on 60s wrap to prevent ring animating backwards from full to empty
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
				stroke="#6366f1"
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
	if (set.isMainLift && set.prescribed.weight != null) {
		return String(set.prescribed.weight);
	}
	if (lastCompletedSetData?.weight) {
		return lastCompletedSetData.weight;
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
	if (set.isMainLift && set.prescribed.reps != null) {
		return String(set.prescribed.reps);
	}
	if (lastCompletedSetData?.reps) {
		return lastCompletedSetData.reps;
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
			<div className="flex flex-col items-center text-center space-y-6">
				{isExerciseTransition && (
					<span className="text-sm font-medium text-neutral-400">Next up</span>
				)}
				<h2 className="text-xl font-semibold text-neutral-100">
					{set.exerciseName}
				</h2>

				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full space-y-2">
					{allSetsForExercise.map((s, idx) => {
						const isCurrent = idx === completedSetsForExercise;
						return (
							<div
								key={s.setNumber}
								className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${
									isCurrent
										? "border-l-2 border-indigo-500 bg-indigo-500/5"
										: "text-neutral-400"
								}`}
							>
								<span
									className={`font-mono ${isCurrent ? "text-neutral-100" : ""}`}
								>
									{s.isMainLift
										? `Set ${s.setNumber}: ${s.prescribed.weight} ${unit} × ${s.prescribed.reps}${s.isAmrap ? "+" : ""}`
										: `Set ${s.setNumber}: ${s.prescribed.repMin}-${s.prescribed.repMax} reps @ RPE ${s.prescribed.rpeMin}-${s.prescribed.rpeMax}`}
								</span>
								{s.isAmrap && (
									<span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-xs font-medium">
										AMRAP
									</span>
								)}
							</div>
						);
					})}
				</div>

				{set.lastSession?.weight != null && (
					<p className="text-indigo-400 font-mono text-sm">
						Last session: {set.lastSession.weight} {unit}
					</p>
				)}

				<button
					type="button"
					onClick={onStartSet}
					className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors min-h-20 text-xl w-full"
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
			<div className="flex flex-col items-center text-center space-y-6 min-h-[70vh] justify-center">
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-neutral-100">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-neutral-400">
						Set {currentSetNumber} of {totalSets}
					</p>
					<p className="font-mono text-lg text-neutral-300">
						{set.isMainLift
							? `${set.prescribed.weight ?? "—"} ${unit} × ${set.prescribed.reps ?? "—"}`
							: `${set.prescribed.repMin ?? "—"}-${set.prescribed.repMax ?? "—"} reps @ RPE ${set.prescribed.rpeMin ?? "—"}-${set.prescribed.rpeMax ?? "—"}`}
					</p>
					{set.isAmrap && (
						<span className="inline-block bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-xs font-medium">
							AMRAP
						</span>
					)}
				</div>

				<div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-80 lg:h-80 flex items-center justify-center">
					<TimerRing seconds={setTimerSeconds} />
					<span className="font-mono text-6xl font-bold text-neutral-100">
						{formatTime(setTimerSeconds)}
					</span>
				</div>

				<div className="w-full mt-auto">
					<button
						type="button"
						onClick={onDone}
						className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors min-h-20 text-xl w-full"
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
			<div className="flex flex-col items-center space-y-6">
				<div className="text-center space-y-2">
					<h2 className="text-xl font-semibold text-neutral-100">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-neutral-400">
						Set {currentSetNumber} of {allSetsForExercise.length}
					</p>
					{set.isMainLift ? (
						<p className="font-mono text-sm text-neutral-400">
							Prescribed: {set.prescribed.weight ?? "—"} {unit} ×{" "}
							{set.prescribed.reps ?? "—"}
						</p>
					) : (
						<div className="space-y-1">
							<p className="text-sm text-neutral-400">
								Record the weight you used. Adjust for your next set if needed.
							</p>
							{hasRpe && (
								<p className="text-sm text-neutral-400">
									Target RPE: {set.prescribed.rpeMin}-{set.prescribed.rpeMax}.
									Felt easy? Consider increasing weight next set.
								</p>
							)}
						</div>
					)}
				</div>

				<div className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-64 lg:h-64 flex items-center justify-center">
					<TimerRing seconds={restTimerSeconds} />
					<span className="font-mono text-6xl font-bold text-neutral-100">
						{formatTime(restTimerSeconds)}
					</span>
				</div>

				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-full space-y-4">
					<label className="block">
						<span className="block text-sm text-neutral-400 mb-1 text-left">
							Weight ({unit})
						</span>
						<input
							type="number"
							inputMode="decimal"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
							className="w-full text-xl font-mono bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
							placeholder="Weight"
						/>
					</label>
					<label className="block">
						<span className="block text-sm text-neutral-400 mb-1 text-left">
							Reps
						</span>
						<input
							type="number"
							inputMode="numeric"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
							className="w-full text-xl font-mono bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
							placeholder="Reps"
						/>
					</label>
					{hasRpe && (
						<label className="block">
							<span className="block text-sm text-neutral-400 mb-1 text-left">
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
								className="w-full text-xl font-mono bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
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
						<label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
							<input
								type="checkbox"
								checked={saveWeight}
								onChange={(e) => setSaveWeight(e.target.checked)}
								className="rounded border-neutral-700 bg-neutral-800"
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
						<p className="text-center text-sm text-neutral-500">
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
						className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors min-h-20 text-xl w-full disabled:opacity-40"
					>
						{isLastSet ? "Finish" : "Next Set"}
					</button>
				</div>
			</div>
		);
	}

	return null;
}
