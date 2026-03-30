import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
			<span className="font-mono text-4xl font-bold text-foreground">
				{formatTime(seconds)}
			</span>
			{total != null && total > 0 && (
				<div className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-foreground rounded-full transition-all duration-1000 ease-linear"
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
	onSkipExercise,
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
					<span className="text-sm font-medium text-muted-foreground">
						Next up
					</span>
				)}
				<h2 className="text-xl font-semibold text-foreground">
					{set.exerciseName}
				</h2>

				<Card className="w-full">
					<CardContent className="space-y-2">
						{allSetsForExercise.map((s, idx) => {
							const isCurrent = idx === completedSetsForExercise;
							return (
								<div
									key={s.setNumber}
									className={cn(
										"flex items-center justify-between text-sm py-1.5 px-3 rounded-lg",
										isCurrent
											? "border-l-2 border-foreground bg-muted"
											: "text-muted-foreground",
									)}
								>
									<span
										className={cn(
											"font-mono",
											isCurrent && "text-foreground font-medium",
										)}
									>
										{s.isMainLift
											? `Set ${s.setNumber}: ${s.prescribed.weight} ${unit} × ${s.prescribed.reps}${s.isAmrap ? "+" : ""}`
											: `Set ${s.setNumber}: ${s.prescribed.repMin}-${s.prescribed.repMax} reps @ RPE ${s.prescribed.rpeMin}-${s.prescribed.rpeMax}`}
									</span>
									{s.isAmrap && <Badge variant="destructive">AMRAP</Badge>}
								</div>
							);
						})}
					</CardContent>
				</Card>

				{set.lastSession?.weight != null && (
					<p className="text-muted-foreground font-mono text-sm">
						Last session: {set.lastSession.weight} {unit}
					</p>
				)}

				<Button
					type="button"
					size="lg"
					className="w-full min-h-20 text-xl"
					onClick={onStartSet}
				>
					Start Set
				</Button>

				{onSkipExercise && (
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={onSkipExercise}
					>
						Skip remaining sets
					</Button>
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
					<h2 className="text-xl font-semibold text-foreground">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-muted-foreground">
						Set {currentSetNumber} of {totalSets}
					</p>
					<p className="font-mono text-lg text-muted-foreground">
						{set.isMainLift
							? `${set.prescribed.weight ?? "—"} ${unit} × ${set.prescribed.reps ?? "—"}`
							: `${set.prescribed.repMin ?? "—"}-${set.prescribed.repMax ?? "—"} reps @ RPE ${set.prescribed.rpeMin ?? "—"}-${set.prescribed.rpeMax ?? "—"}`}
					</p>
					{set.isAmrap && <Badge variant="destructive">AMRAP</Badge>}
				</div>

				<TimerDisplay seconds={setTimerSeconds} />

				<div className="w-full mt-auto">
					<Button
						type="button"
						size="lg"
						className="w-full min-h-20 text-xl"
						onClick={onDone}
					>
						Done
					</Button>
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
					<h2 className="text-xl font-semibold text-foreground">
						{set.exerciseName}
					</h2>
					<p className="text-sm font-medium text-muted-foreground">
						Set {currentSetNumber} of {allSetsForExercise.length}
					</p>
					{set.isMainLift ? (
						<p className="font-mono text-sm text-muted-foreground">
							Prescribed: {set.prescribed.weight ?? "—"} {unit} ×{" "}
							{set.prescribed.reps ?? "—"}
						</p>
					) : (
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">
								Record the weight you used. Adjust for your next set if needed.
							</p>
							{hasRpe && (
								<p className="text-sm text-muted-foreground">
									Target RPE: {set.prescribed.rpeMin}-{set.prescribed.rpeMax}.
									Felt easy? Consider increasing weight next set.
								</p>
							)}
						</div>
					)}
				</div>

				<TimerDisplay seconds={restTimerSeconds} />

				<Card className="w-full">
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1.5">
								<Label>Weight ({unit})</Label>
								<Input
									type="number"
									inputMode="decimal"
									value={weight}
									onChange={(e) => setWeight(e.target.value)}
									className={cn("font-mono text-xl")}
									placeholder="Weight"
								/>
							</div>
							<div className="space-y-1.5">
								<Label>Reps</Label>
								<Input
									type="number"
									inputMode="numeric"
									value={reps}
									onChange={(e) => setReps(e.target.value)}
									className={cn("font-mono text-xl")}
									placeholder="Reps"
								/>
							</div>
							{hasRpe ? (
								<div className="space-y-1.5">
									<Label>
										RPE ({set.prescribed.rpeMin}-{set.prescribed.rpeMax})
									</Label>
									<Input
										type="number"
										inputMode="numeric"
										min={1}
										max={10}
										step={0.5}
										value={rpe}
										onChange={(e) => setRpe(e.target.value)}
										className={cn("font-mono text-xl")}
										placeholder="RPE"
									/>
									{rpeError && (
										<span className="text-destructive text-xs mt-1 block">
											{rpeError}
										</span>
									)}
								</div>
							) : (
								<div />
							)}
						</div>

						{isLastSetOfAccessory && (
							<label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
								<input
									type="checkbox"
									checked={saveWeight}
									onChange={(e) => setSaveWeight(e.target.checked)}
									className="rounded border-border"
								/>
								Save weight for next time?
							</label>
						)}
					</CardContent>
				</Card>

				<div className="w-full space-y-3">
					<WorkoutProgress
						current={progress.current}
						total={progress.total}
						exerciseName={set.exerciseName}
					/>

					{showUpNext && (
						<p className="text-center text-sm text-muted-foreground">
							Up next: {nextExerciseName}
						</p>
					)}

					<Button
						type="button"
						size="lg"
						className="w-full min-h-20 text-xl"
						disabled={!reps}
						onClick={() =>
							onConfirmAndNext({
								actualWeight: weight ? Number(weight) : null,
								actualReps: Number(reps),
								rpe: rpe ? Number(rpe) : null,
								saveWeight: isLastSetOfAccessory ? saveWeight : undefined,
							})
						}
					>
						{isLastSet ? "Finish" : "Next Set"}
					</Button>

					{onSkipExercise && (
						<Button
							type="button"
							variant="ghost"
							className="w-full"
							onClick={onSkipExercise}
						>
							Skip remaining sets
						</Button>
					)}
				</div>
			</div>
		);
	}

	return null;
}
