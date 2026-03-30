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
	suggestedWeight?: number;
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
	onSkipExercise?: () => void;
}

function formatTime(s: number): string {
	const mins = Math.floor(s / 60);
	const secs = s % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function TimerDisplay({ seconds, total }: { seconds: number; total?: number }) {
	const progress = total && total > 0 ? Math.min(seconds / total, 1) : 0;
	return (
		<div className="flex flex-col items-center gap-2 w-full">
			<span className="font-mono text-4xl font-bold text-black">
				{formatTime(seconds)}
			</span>
			{total != null && total > 0 && (
				<div className="w-full max-w-xs h-1 bg-gray-200 rounded-full overflow-hidden">
					<div
						className="h-full bg-black rounded-full transition-all duration-1000 ease-linear"
						style={{ width: `${progress * 100}%` }}
					/>
				</div>
			)}
		</div>
	);
}

function getDefaultWeight(
	set: FlatSet,
	preferredWeight?: number,
	suggestedWeight?: number,
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
	if (suggestedWeight != null) {
		return String(suggestedWeight);
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
	suggestedWeight,
	lastCompletedSetData,
	progress,
	onStartSet,
	onDone,
	onConfirmAndNext,
	onSkipExercise,
}: ActiveSetViewProps) {
	const [weight, setWeight] = useState<string>(
		getDefaultWeight(
			set,
			preferredWeight,
			suggestedWeight,
			lastCompletedSetData,
		),
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
					<span className="text-sm font-medium text-gray-500">Next up</span>
				)}
				<h2 className="text-xl font-semibold text-black">{set.exerciseName}</h2>

				<div className="card w-full space-y-2">
					{allSetsForExercise.map((s, idx) => {
						const isCurrent = idx === completedSetsForExercise;
						return (
							<div
								key={s.setNumber}
								className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${
									isCurrent
										? "border-l-2 border-black bg-gray-50"
										: "text-gray-500"
								}`}
							>
								<span
									className={`font-mono ${isCurrent ? "text-black font-medium" : ""}`}
								>
									{s.isMainLift
										? `Set ${s.setNumber}: ${s.prescribed.weight} ${unit} × ${s.prescribed.reps}${s.isAmrap ? "+" : ""}`
										: `Set ${s.setNumber}: ${s.prescribed.repMin}-${s.prescribed.repMax} reps @ RPE ${s.prescribed.rpeMin}-${s.prescribed.rpeMax}`}
								</span>
								{s.isAmrap && (
									<span className="badge bg-red-50 text-red-600">AMRAP</span>
								)}
							</div>
						);
					})}
				</div>

				{set.lastSession?.weight != null && (
					<p className="text-gray-600 font-mono text-sm">
						Last session: {set.lastSession.weight} {unit}
					</p>
				)}

				<button
					type="button"
					onClick={onStartSet}
					className="btn-primary w-full"
				>
					Start Set
				</button>

				{onSkipExercise && (
					<button
						type="button"
						onClick={onSkipExercise}
						className="btn-ghost w-full"
					>
						Skip remaining sets
					</button>
				)}
			</div>
		);
	}

	if (phase === "active") {
		const currentSetNumber = completedSetsForExercise + 1;
		const totalSets = allSetsForExercise.length;

		return (
			<div className="flex flex-col items-center text-center space-y-6 min-h-[70vh] justify-center">
				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-black">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-gray-500">
						Set {currentSetNumber} of {totalSets}
					</p>
					<p className="font-mono text-lg text-gray-600">
						{set.isMainLift
							? `${set.prescribed.weight ?? "—"} ${unit} × ${set.prescribed.reps ?? "—"}`
							: `${set.prescribed.repMin ?? "—"}-${set.prescribed.repMax ?? "—"} reps @ RPE ${set.prescribed.rpeMin ?? "—"}-${set.prescribed.rpeMax ?? "—"}`}
					</p>
					{set.isAmrap && (
						<span className="badge bg-red-50 text-red-600">AMRAP</span>
					)}
				</div>

				<TimerDisplay seconds={setTimerSeconds} />

				<div className="w-full mt-auto">
					<button type="button" onClick={onDone} className="btn-primary w-full">
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
					<h2 className="text-xl font-semibold text-black">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-gray-500">
						Set {currentSetNumber} of {allSetsForExercise.length}
					</p>
					{set.isMainLift ? (
						<p className="font-mono text-sm text-gray-500">
							Prescribed: {set.prescribed.weight ?? "—"} {unit} ×{" "}
							{set.prescribed.reps ?? "—"}
						</p>
					) : (
						<div className="space-y-1">
							<p className="text-sm text-gray-500">
								Record the weight you used. Adjust for your next set if needed.
							</p>
							{hasRpe && (
								<p className="text-sm text-gray-500">
									Target RPE: {set.prescribed.rpeMin}-{set.prescribed.rpeMax}.
									Felt easy? Consider increasing weight next set.
								</p>
							)}
						</div>
					)}
				</div>

				<TimerDisplay seconds={restTimerSeconds} />

				<div className="card w-full space-y-4">
					<div className="grid grid-cols-3 gap-3">
						<label className="block">
							<span className="label">Weight ({unit})</span>
							<input
								type="number"
								inputMode="decimal"
								value={weight}
								onChange={(e) => setWeight(e.target.value)}
								className="input w-full font-mono"
								placeholder="Weight"
							/>
						</label>
						<label className="block">
							<span className="label">Reps</span>
							<input
								type="number"
								inputMode="numeric"
								value={reps}
								onChange={(e) => setReps(e.target.value)}
								className="input w-full font-mono"
								placeholder="Reps"
							/>
						</label>
						{hasRpe ? (
							<label className="block">
								<span className="label">
									RPE ({set.prescribed.rpeMin}-{set.prescribed.rpeMax})
								</span>
								<input
									type="number"
									inputMode="numeric"
									min={1}
									max={10}
									step={0.5}
									value={rpe}
									onChange={(e) => setRpe(e.target.value)}
									className="input w-full font-mono"
									placeholder="RPE"
								/>
								{rpeError && (
									<span className="text-red-600 text-xs mt-1 block">
										{rpeError}
									</span>
								)}
							</label>
						) : (
							<div />
						)}
					</div>

					{isLastSetOfAccessory && (
						<label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
							<input
								type="checkbox"
								checked={saveWeight}
								onChange={(e) => setSaveWeight(e.target.checked)}
								className="rounded border-gray-300"
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
						<p className="text-center text-sm text-gray-400">
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
						className="btn-primary w-full"
					>
						{isLastSet ? "Finish" : "Next Set"}
					</button>

					{onSkipExercise && (
						<button
							type="button"
							onClick={onSkipExercise}
							className="btn-ghost w-full"
						>
							Skip remaining sets
						</button>
					)}
				</div>
			</div>
		);
	}

	return null;
}
