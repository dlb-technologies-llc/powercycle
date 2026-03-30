import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { WorkoutPlanResponse } from "@powercycle/shared/schema/api";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { upsertExerciseWeightAtom } from "../atoms/exercise-weights";
import {
	completeWorkoutAtom,
	logSetAtom,
	nextWorkoutAtom,
	skipSetsAtom,
} from "../atoms/workouts";
import type { FlatSet } from "../hooks/useWorkoutFlow";
import { useWorkoutFlow } from "../hooks/useWorkoutFlow";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import { ActiveSetView } from "./ActiveSetView";
import { WorkoutOverview } from "./WorkoutOverview";

type WorkoutPlanData = typeof WorkoutPlanResponse.Type;

interface WorkoutIslandProps {
	workoutId?: string;
}

function buildSetPayload(
	currentSet: FlatSet,
	data: {
		actualWeight: number | null;
		actualReps: number;
		rpe: number | null;
	},
) {
	return {
		exerciseName: currentSet.exerciseName,
		setNumber: currentSet.setNumber,
		prescribedWeight: currentSet.prescribed.weight ?? null,
		actualWeight: data.actualWeight,
		prescribedReps: currentSet.prescribed.reps ?? null,
		actualReps: data.actualReps,
		rpe: data.rpe,
		prescribedRpeMin: currentSet.prescribed.rpeMin ?? null,
		prescribedRpeMax: currentSet.prescribed.rpeMax ?? null,
		isMainLift: currentSet.isMainLift,
		isAmrap: currentSet.isAmrap,
		category: currentSet.category,
	};
}

function buildSelectionsFromLocalStorage(
	plan: WorkoutPlanData,
): Record<string, string> {
	const selections: Record<string, string> = {};
	if (typeof window === "undefined") return selections;

	const variationKey = `${plan.variation.category}-variation`;
	const stored = localStorage.getItem(
		`exercise-pref-${plan.variation.category}-variation`,
	);
	selections[variationKey] = stored || plan.variation.defaultExercise;

	plan.accessories.forEach((acc, i) => {
		const accKey = `${acc.category}-${i}`;
		const accStored = localStorage.getItem(
			`exercise-pref-${acc.category}-${i}`,
		);
		selections[accKey] = accStored || acc.defaultExercise;
	});

	return selections;
}

export default function WorkoutIsland({ workoutId }: WorkoutIslandProps) {
	const id =
		workoutId ??
		(typeof window !== "undefined"
			? new URLSearchParams(window.location.search).get("id")
			: null);
	const [isFinishing, setIsFinishing] = useState(false);

	const result = useAtomValue(nextWorkoutAtom);
	const logSet = useAtomSet(logSetAtom, { mode: "promiseExit" });
	const completeWorkout = useAtomSet(completeWorkoutAtom, {
		mode: "promiseExit",
	});
	const upsertWeight = useAtomSet(upsertExerciseWeightAtom, {
		mode: "promiseExit",
	});
	const skipSets = useAtomSet(skipSetsAtom, { mode: "promiseExit" });

	const plan: WorkoutPlanData | null | undefined = (() => {
		if (AsyncResult.isInitial(result) || result.waiting) return undefined;
		if (AsyncResult.isFailure(result)) return undefined;
		return result.value;
	})();

	const flow = useWorkoutFlow(plan ?? null);
	const setTimer = useWorkoutTimer();
	const restTimer = useWorkoutTimer();
	const completedSetsDataRef = useRef<
		Record<string, { weight: string; reps: string; rpe: string }>
	>({});
	const pendingSetRef = useRef<{
		data: ReturnType<typeof buildSetPayload>;
		setDuration: number;
	} | null>(null);
	const [resumeChecked, setResumeChecked] = useState(false);

	// Track previous phase to manage timer transitions
	const prevPhaseRef = useRef(flow.phase);
	useEffect(() => {
		const prev = prevPhaseRef.current;
		const curr = flow.phase;
		prevPhaseRef.current = curr;

		if (curr === "active" && prev !== "active") {
			setTimer.reset();
			setTimer.start();
		}
		if (curr === "resting" && prev !== "resting") {
			restTimer.reset();
			restTimer.start();
		}
		// Rest timer is stopped in handleDone to capture the rest duration
		// before sending the pending set data to the API
	}, [flow.phase, setTimer, restTimer]);

	useEffect(() => {
		if (!id || !plan || resumeChecked) return;

		Promise.all([
			fetch(`/api/workouts/${id}/sets`).then(async (res) => {
				if (!res.ok) throw new Error("Failed to fetch sets");
				const data: unknown[] = await res.json();
				return data;
			}),
			fetch("/api/preferences/exercises")
				.then(async (res) => {
					if (!res.ok) return [];
					const data: Array<{ slotKey: string; exerciseName: string }> =
						await res.json();
					return data;
				})
				.catch((): Array<{ slotKey: string; exerciseName: string }> => []),
		])
			.then(([sets, prefs]) => {
				if (sets.length > 0) {
					const selections = buildSelectionsFromLocalStorage(plan);
					for (const p of prefs) {
						selections[p.slotKey] = p.exerciseName;
					}
					flow.initializeAt(sets.length, selections);
				}
				setResumeChecked(true);
			})
			.catch(() => {
				setResumeChecked(true);
			});
	}, [id, plan, resumeChecked, flow.initializeAt]);

	if (!id) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-muted-foreground">No workout ID provided.</p>
			</div>
		);
	}

	if (plan === undefined) {
		if (
			!AsyncResult.isInitial(result) &&
			!result.waiting &&
			AsyncResult.isFailure(result)
		) {
			return (
				<div className="flex items-center justify-center min-h-[60vh]">
					<p className="text-destructive">Failed to load workout plan.</p>
				</div>
			);
		}
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-muted-foreground">Loading workout plan...</p>
			</div>
		);
	}

	if (!plan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<p className="text-muted-foreground mb-4">No workout available.</p>
				<a
					href="/"
					className={cn(
						"text-foreground underline hover:text-muted-foreground transition-colors",
					)}
				>
					Back to dashboard
				</a>
			</div>
		);
	}

	if (plan && !resumeChecked) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-muted-foreground">Checking workout progress...</p>
			</div>
		);
	}

	const sendLogSet = (
		data: ReturnType<typeof buildSetPayload>,
		setDuration: number,
		restDuration: number | null,
	) => {
		logSet({
			params: { id },
			payload: { ...data, setDuration, restDuration },
		}).catch((err) => console.error("Failed to log set", err));
	};

	const handleStart = (
		selections: Record<string, string>,
		skippedExercises?: ReadonlySet<string>,
	) => {
		flow.startWorkout(selections);
		// Skip exercises that were marked in the overview
		if (skippedExercises && skippedExercises.size > 0) {
			// After starting, iterate through skipped exercises and fire skip API calls
			for (const exerciseKey of skippedExercises) {
				// The flow will handle advancing past these in the UI
				// We need to fire the API call for each skipped exercise
				const skipInfo = flow.skipExercise();
				if (skipInfo) {
					skipSets({
						params: { id },
						payload: {
							exerciseName: skipInfo.exerciseName,
							fromSetNumber: skipInfo.fromSetNumber,
						},
					}).catch((err) => console.error("Failed to skip sets", err));
				}
			}
		}
	};

	const handleStartSet = () => {
		flow.startSet();
	};

	const handleDone = () => {
		const setDuration = setTimer.stop();

		// Send any pending set with its rest duration
		if (pendingSetRef.current) {
			const restDuration = restTimer.stop();
			sendLogSet(
				pendingSetRef.current.data,
				pendingSetRef.current.setDuration,
				restDuration,
			);
			pendingSetRef.current = null;
		}

		// Build payload for the current set — store it as pending
		if (!flow.currentSet) return;
		const apiData = buildSetPayload(flow.currentSet, {
			actualWeight: null,
			actualReps: 0,
			rpe: null,
		});

		// Store partially — we'll update with actual data in confirmAndNext
		pendingSetRef.current = { data: apiData, setDuration };

		flow.completeSet();
	};

	const handleConfirmAndNext = (data: {
		actualWeight: number | null;
		actualReps: number;
		rpe: number | null;
		saveWeight?: boolean;
	}) => {
		// Store the entered data for prefilling the next set of the same exercise
		if (flow.currentSet) {
			completedSetsDataRef.current[flow.currentSet.exerciseName] = {
				weight: data.actualWeight != null ? String(data.actualWeight) : "",
				reps: String(data.actualReps),
				rpe: data.rpe != null ? String(data.rpe) : "",
			};
		}

		// Update the pending set with actual data from the rest screen
		if (pendingSetRef.current && flow.currentSet) {
			const apiData = buildSetPayload(flow.currentSet, data);
			pendingSetRef.current = {
				...pendingSetRef.current,
				data: apiData,
			};
		}

		// If this is the last set, send the pending set immediately with no rest
		if (flow.isLastSet && pendingSetRef.current) {
			sendLogSet(
				pendingSetRef.current.data,
				pendingSetRef.current.setDuration,
				null,
			);
			pendingSetRef.current = null;
		}

		// Save weight if requested
		if (data.saveWeight && flow.currentSet && data.actualWeight != null) {
			upsertWeight({
				payload: {
					exerciseName: flow.currentSet.exerciseName,
					weight: data.actualWeight,
					unit: "lbs",
					rpe: data.rpe,
				},
			}).catch(() => {
				// Silently fail
			});
		}

		flow.confirmAndNext();
	};

	const handleFinish = async () => {
		setIsFinishing(true);
		const exit = await completeWorkout({ params: { id } });
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to complete workout");
				setIsFinishing(false);
			},
			onSuccess: () => {
				window.location.href = "/";
			},
		});
	};

	const handleSkipExercise = () => {
		const skipInfo = flow.skipExercise();
		if (!skipInfo) return;
		skipSets({
			params: { id },
			payload: {
				exerciseName: skipInfo.exerciseName,
				fromSetNumber: skipInfo.fromSetNumber,
			},
		}).catch((err) => console.error("Failed to skip sets", err));
	};

	if (flow.phase === "overview") {
		return (
			<div className="space-y-8 pb-8">
				<WorkoutOverview plan={plan} unit="lbs" onStart={handleStart} />
			</div>
		);
	}

	if (flow.phase === "complete") {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
				<Card className="p-8">
					<CardContent className="space-y-4">
						<h1 className="text-4xl font-semibold text-foreground">
							Workout complete
						</h1>
						<p className="text-muted-foreground">
							All {flow.totalSets} sets finished
						</p>
					</CardContent>
				</Card>
				<Button
					type="button"
					onClick={handleFinish}
					disabled={isFinishing}
					size="lg"
					className="w-full min-h-20 text-xl"
				>
					{isFinishing ? "Finishing..." : "Finish workout"}
				</Button>
			</div>
		);
	}

	// ready, active, resting phases — currentSet is always defined here
	const currentSet = flow.currentSet;
	if (!currentSet) return null;

	return (
		<div className="space-y-8 pb-8">
			<ActiveSetView
				key={`${currentSet.exerciseName}-${currentSet.setNumber}`}
				set={currentSet}
				phase={flow.phase}
				setTimerSeconds={setTimer.seconds}
				restTimerSeconds={restTimer.seconds}
				isLastSet={flow.isLastSet}
				isExerciseTransition={flow.isExerciseTransition}
				allSetsForExercise={flow.allSetsForCurrentExercise}
				completedSetsForExercise={flow.completedSetsForCurrentExercise}
				nextExerciseName={flow.nextExerciseName}
				unit="lbs"
				preferredWeight={flow.currentSet?.preferredWeight}
				lastCompletedSetData={
					completedSetsDataRef.current[currentSet.exerciseName]
				}
				progress={flow.progress}
				onStartSet={handleStartSet}
				onDone={handleDone}
				onConfirmAndNext={handleConfirmAndNext}
				onSkipExercise={handleSkipExercise}
			/>
		</div>
	);
}
