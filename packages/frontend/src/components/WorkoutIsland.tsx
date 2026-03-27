import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { WorkoutPlanResponse } from "@powercycle/shared/schema/api";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useEffect, useRef, useState } from "react";
import { upsertExerciseWeightAtom } from "../atoms/exercise-weights";
import {
	completeWorkoutAtom,
	logSetAtom,
	nextWorkoutAtom,
} from "../atoms/workouts";
import type { FlatSet } from "../hooks/useWorkoutFlow";
import { useWorkoutFlow } from "../hooks/useWorkoutFlow";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import type { DeepMutable } from "../lib/types";
import { ActiveSetView } from "./ActiveSetView";
import { WorkoutOverview } from "./WorkoutOverview";

type WorkoutPlanData = DeepMutable<typeof WorkoutPlanResponse.Type>;

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

	const plan = (() => {
		if (AsyncResult.isInitial(result) || result.waiting) return undefined;
		if (AsyncResult.isFailure(result)) return undefined;
		return result.value as WorkoutPlanData | null;
	})();

	const flow = useWorkoutFlow(plan ?? null);
	const setTimer = useWorkoutTimer();
	const restTimer = useWorkoutTimer();
	const pendingSetRef = useRef<{
		data: Record<string, unknown>;
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
			fetch(`/api/workouts/${id}/sets`).then((res) => {
				if (!res.ok) throw new Error("Failed to fetch sets");
				return res.json() as Promise<unknown[]>;
			}),
			fetch("/api/preferences/exercises")
				.then((res) => {
					if (!res.ok) return [];
					return res.json() as Promise<
						Array<{ slotKey: string; exerciseName: string }>
					>;
				})
				.catch(() => [] as Array<{ slotKey: string; exerciseName: string }>),
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
				<p className="text-zinc-400">No workout ID provided.</p>
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
					<p className="text-red-400">Failed to load workout plan.</p>
				</div>
			);
		}
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading workout plan...</p>
			</div>
		);
	}

	if (!plan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
				<p className="text-zinc-400 mb-4">No workout available.</p>
				<a
					href="/"
					className="text-zinc-100 underline hover:text-zinc-300 transition-colors"
				>
					Back to Dashboard
				</a>
			</div>
		);
	}

	if (plan && !resumeChecked) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Checking workout progress...</p>
			</div>
		);
	}

	const sendLogSet = (
		data: Record<string, unknown>,
		setDuration: number,
		restDuration: number | null,
	) => {
		logSet({
			params: { id },
			payload: { ...data, setDuration, restDuration } as {
				exerciseName: string;
				setNumber: number;
				prescribedWeight: number | null;
				actualWeight: number | null;
				prescribedReps: number | null;
				actualReps: number | null;
				rpe: number | null;
				prescribedRpeMin: number | null;
				prescribedRpeMax: number | null;
				isMainLift: boolean;
				isAmrap: boolean;
				setDuration: number | null;
				restDuration: number | null;
				category: string | null;
			},
		}).catch((err) => console.error("Failed to log set", err));
	};

	const handleStart = (selections: Record<string, string>) => {
		flow.startWorkout(selections);
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
		const apiData = buildSetPayload(flow.currentSet!, {
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
		// Update the pending set with actual data from the rest screen
		if (pendingSetRef.current) {
			const apiData = buildSetPayload(flow.currentSet!, data);
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

	if (flow.phase === "overview") {
		return (
			<div className="space-y-8 pb-8">
				<WorkoutOverview plan={plan} unit="lbs" onStart={handleStart} />
			</div>
		);
	}

	if (flow.phase === "complete") {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
				<div className="glass-card p-8 space-y-4">
					<h1 className="text-4xl font-[family-name:var(--font-heading)] font-bold gradient-text-green uppercase">
						Workout Complete!
					</h1>
					<p className="text-zinc-400">All {flow.totalSets} sets finished</p>
				</div>
				<button
					type="button"
					onClick={handleFinish}
					disabled={isFinishing}
					className="btn-gradient-green min-h-20 rounded-2xl text-xl w-full disabled:opacity-50"
				>
					{isFinishing ? "Finishing..." : "Finish Workout"}
				</button>
			</div>
		);
	}

	// ready, active, resting phases
	return (
		<div className="space-y-8 pb-8">
			<ActiveSetView
				key={`${flow.currentSet!.exerciseName}-${flow.currentSet!.setNumber}`}
				set={flow.currentSet!}
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
				progress={flow.progress}
				onStartSet={handleStartSet}
				onDone={handleDone}
				onConfirmAndNext={handleConfirmAndNext}
			/>
		</div>
	);
}
