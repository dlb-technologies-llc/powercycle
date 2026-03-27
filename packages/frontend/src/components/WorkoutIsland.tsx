import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useRef, useState } from "react";
import {
	completeWorkoutAtom,
	logSetAtom,
	nextWorkoutAtom,
} from "../atoms/workouts";
import type { FlatSet } from "../hooks/useWorkoutFlow";
import { useWorkoutFlow } from "../hooks/useWorkoutFlow";
import { useWorkoutTimer } from "../hooks/useWorkoutTimer";
import { ActiveSetView } from "./ActiveSetView";
import { WorkoutOverview } from "./WorkoutOverview";
import { WorkoutProgress } from "./WorkoutProgress";

interface WorkoutIslandProps {
	workoutId?: string;
}

function buildSetPayload(
	currentSet: FlatSet,
	data: { actualWeight: number | null; actualReps: number; rpe: number | null },
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

	const plan = (() => {
		if (AsyncResult.isInitial(result) || result.waiting) return undefined;
		if (AsyncResult.isFailure(result)) return undefined;
		return result.value as {
			day: number;
			round: number;
			cycle: number;
			mainLift: string;
			mainLiftSets: Array<{
				setNumber: number;
				weight: number;
				reps: number;
				percentage: number;
				isAmrap: boolean;
			}>;
			variation: {
				category: string;
				defaultExercise: string;
				sets: Array<{
					setNumber: number;
					rpeMin: number;
					rpeMax: number;
					repMin: number;
					repMax: number;
				}>;
			};
			accessories: Array<{
				category: string;
				defaultExercise: string;
				sets: Array<{
					setNumber: number;
					rpeMin: number;
					rpeMax: number;
					repMin: number;
					repMax: number;
				}>;
			}>;
		} | null;
	})();

	const flow = useWorkoutFlow(plan ?? null);
	const setTimer = useWorkoutTimer();
	const restTimer = useWorkoutTimer();
	const pendingSetRef = useRef<{
		data: Record<string, unknown>;
		setDuration: number;
	} | null>(null);

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
		setTimer.reset();
		setTimer.start();
		flow.startSet();
	};

	const handleDone = () => {
		flow.completeSet();
	};

	const handleConfirm = (data: {
		actualWeight: number | null;
		actualReps: number;
		rpe: number | null;
	}) => {
		const setDuration = setTimer.stop();

		if (pendingSetRef.current) {
			const restDuration = restTimer.stop();
			sendLogSet(
				pendingSetRef.current.data,
				pendingSetRef.current.setDuration,
				restDuration,
			);
			pendingSetRef.current = null;
		}

		const apiData = buildSetPayload(flow.currentSet!, data);

		if (flow.isLastSet) {
			sendLogSet(apiData, setDuration, null);
		} else {
			pendingSetRef.current = { data: apiData, setDuration };
		}

		if (!flow.isLastSet) {
			restTimer.reset();
			restTimer.start();
		}
		flow.logSet();
	};

	const handleStartNextSet = () => {
		if (pendingSetRef.current) {
			const restDuration = restTimer.stop();
			sendLogSet(
				pendingSetRef.current.data,
				pendingSetRef.current.setDuration,
				restDuration,
			);
			pendingSetRef.current = null;
		}
		restTimer.reset();
		flow.startNextSet();
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
			<div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
				<h1 className="text-3xl font-bold text-zinc-100">Workout Complete!</h1>
				<p className="text-zinc-400">All {flow.totalSets} sets finished</p>
				<button
					type="button"
					onClick={handleFinish}
					disabled={isFinishing}
					className="w-full min-h-16 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors"
				>
					{isFinishing ? "Finishing..." : "Finish Workout"}
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-8 pb-8">
			<WorkoutProgress
				current={flow.progress.current}
				total={flow.progress.total}
			/>
			<ActiveSetView
				key={`${flow.currentSet!.exerciseName}-${flow.currentSet!.setNumber}`}
				set={flow.currentSet!}
				phase={flow.phase}
				setTimerSeconds={setTimer.seconds}
				restTimerSeconds={restTimer.seconds}
				isLastSet={flow.isLastSet}
				nextExerciseName={flow.nextExerciseName}
				unit="lbs"
				onStartSet={handleStartSet}
				onDone={handleDone}
				onConfirm={handleConfirm}
				onStartNextSet={handleStartNextSet}
			/>
		</div>
	);
}
