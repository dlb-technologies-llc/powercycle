import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import type { MainLift } from "@powercycle/shared/schema/lifts";
import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { update1rmAtom } from "../atoms/cycles";
import { nextWorkoutAtom } from "../atoms/workouts";

const LIFT_DISPLAY_NAMES: Record<MainLift, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

const DAY_NAMES: Record<MainLift, string> = {
	squat: "Squat Day",
	bench: "Bench Day",
	deadlift: "Deadlift Day",
	ohp: "OHP Day",
};

// Widen EXERCISE_OPTIONS for string-key lookup (cast-free)
const exerciseOptionsLookup: Record<string, readonly string[] | undefined> =
	EXERCISE_OPTIONS;

interface WorkoutOverviewProps {
	plan: {
		readonly day: number;
		readonly round: number;
		readonly cycle: number;
		readonly mainLift: MainLift;
		readonly mainLiftSets: ReadonlyArray<{
			readonly setNumber: number;
			readonly weight: number;
			readonly reps: number;
			readonly percentage: number;
			readonly isAmrap: boolean;
		}>;
		readonly variation: {
			readonly category: string;
			readonly defaultExercise: string;
			readonly preferredWeight?: number | null;
			readonly lastSession?: {
				readonly weight: number | null;
				readonly reps: number | null;
				readonly rpe: number | null;
			} | null;
			readonly sets: ReadonlyArray<{
				readonly setNumber: number;
				readonly rpeMin: number;
				readonly rpeMax: number;
				readonly repMin: number;
				readonly repMax: number;
			}>;
		};
		readonly accessories: ReadonlyArray<{
			readonly category: string;
			readonly defaultExercise: string;
			readonly preferredWeight?: number | null;
			readonly lastSession?: {
				readonly weight: number | null;
				readonly reps: number | null;
				readonly rpe: number | null;
			} | null;
			readonly sets: ReadonlyArray<{
				readonly setNumber: number;
				readonly rpeMin: number;
				readonly rpeMax: number;
				readonly repMin: number;
				readonly repMax: number;
			}>;
		}>;
	};
	unit: string;
	onStart: (selections: Record<string, string>) => void;
}

export function WorkoutOverview({ plan, unit, onStart }: WorkoutOverviewProps) {
	const variationKey = `${plan.variation.category}-variation`;
	const [selections, setSelections] = useState<Record<string, string>>(() => {
		const initial: Record<string, string> = {};
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem(
				`exercise-pref-${plan.variation.category}-variation`,
			);
			initial[variationKey] = stored || plan.variation.defaultExercise;
			plan.accessories.forEach((acc, i) => {
				const accKey = `${acc.category}-${i}`;
				const accStored = localStorage.getItem(
					`exercise-pref-${acc.category}-${i}`,
				);
				initial[accKey] = accStored || acc.defaultExercise;
			});
		} else {
			initial[variationKey] = plan.variation.defaultExercise;
			plan.accessories.forEach((acc, i) => {
				initial[`${acc.category}-${i}`] = acc.defaultExercise;
			});
		}
		return initial;
	});

	useEffect(() => {
		fetch("/api/preferences/exercises")
			.then((res) => res.json())
			.then((prefs: Array<{ slotKey: string; exerciseName: string }>) => {
				if (prefs.length > 0) {
					const updates: Record<string, string> = {};
					for (const p of prefs) {
						updates[p.slotKey] = p.exerciseName;
						// Sync API → localStorage
						if (typeof window !== "undefined") {
							localStorage.setItem(
								`exercise-pref-${p.slotKey}`,
								p.exerciseName,
							);
						}
					}
					setSelections((prev) => ({ ...prev, ...updates }));
				}
			})
			.catch(() => {
				// Silently fall back to localStorage
			});
	}, []);

	const updateSelection = (key: string, storageKey: string, value: string) => {
		setSelections((prev) => ({ ...prev, [key]: value }));
		if (typeof window !== "undefined") {
			localStorage.setItem(`exercise-pref-${storageKey}`, value);
		}
		// Persist to API (fire-and-forget)
		fetch("/api/preferences/exercises", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ slotKey: key, exerciseName: value }),
		}).catch(() => {
			// Silently fall back to localStorage only
		});
	};

	const mainLiftName = LIFT_DISPLAY_NAMES[plan.mainLift] ?? plan.mainLift;
	const dayName = DAY_NAMES[plan.mainLift] ?? `${mainLiftName} Day`;

	const [oneRmInput, setOneRmInput] = useState("");
	const [oneRmError, setOneRmError] = useState("");
	const [isSubmitting1rm, setIsSubmitting1rm] = useState(false);
	const update1rm = useAtomSet(update1rmAtom, { mode: "promiseExit" });
	const refreshWorkout = useAtomRefresh(nextWorkoutAtom);

	const handleSubmit1rm = async () => {
		const value = Number(oneRmInput);
		if (!value || value <= 0) {
			setOneRmError("Enter a valid weight");
			return;
		}
		setIsSubmitting1rm(true);
		setOneRmError("");
		const exit = await update1rm({
			payload: {
				lift: plan.mainLift,
				value,
			},
		});
		Exit.match(exit, {
			onFailure: () => {
				setOneRmError("Failed to save");
				setIsSubmitting1rm(false);
			},
			onSuccess: () => {
				refreshWorkout();
				setOneRmInput("");
				setIsSubmitting1rm(false);
			},
		});
	};

	const variationOptions = exerciseOptionsLookup[plan.variation.category] ?? [];

	// Determine the best weight to show for variation
	const variationDisplayWeight =
		plan.variation.lastSession?.weight ?? plan.variation.preferredWeight;

	return (
		<div className="space-y-6">
			{/* Title */}
			<div>
				<h1 className="text-2xl font-semibold text-neutral-100">{dayName}</h1>
				<p className="text-sm text-neutral-400 mt-1">
					Cycle {plan.cycle} &middot; Round {plan.round}
				</p>
			</div>

			{/* Main Lift Section */}
			{plan.mainLiftSets.length === 0 ? (
				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
					<h2 className="text-lg font-semibold text-neutral-100">
						{mainLiftName}
					</h2>
					<p className="text-sm text-neutral-400">
						Enter your 1RM for {mainLiftName} to calculate your sets.
					</p>
					<div className="flex gap-3">
						<input
							type="number"
							value={oneRmInput}
							onChange={(e) => setOneRmInput(e.target.value)}
							placeholder={`1RM in ${unit}`}
							className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleSubmit1rm}
							disabled={isSubmitting1rm}
							className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors disabled:opacity-50"
						>
							{isSubmitting1rm ? "Saving..." : "Save"}
						</button>
					</div>
					{oneRmError && <p className="text-red-400 text-sm">{oneRmError}</p>}
				</div>
			) : (
				<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
					<h2 className="text-lg font-semibold text-neutral-100">
						{mainLiftName}
					</h2>
					<div className="space-y-1">
						{plan.mainLiftSets.map((s) => (
							<div
								key={s.setNumber}
								className="flex items-center justify-between text-sm text-neutral-300 py-1.5"
							>
								<span className="font-mono text-sm text-neutral-300">
									Set {s.setNumber}: {s.weight} {unit} &times; {s.reps}
									{s.isAmrap ? "+" : ""}
								</span>
								{s.isAmrap && (
									<span className="bg-red-500/10 text-red-400 rounded-md px-2 py-0.5 text-xs font-medium">
										AMRAP
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Variation Section */}
			<div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3">
				<h2 className="text-lg font-semibold text-neutral-100">Variation</h2>
				<select
					value={selections[variationKey]}
					onChange={(e) =>
						updateSelection(
							variationKey,
							`${plan.variation.category}-variation`,
							e.target.value,
						)
					}
					className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
				>
					{variationOptions.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
				<div className="space-y-1">
					{plan.variation.sets.map((s) => (
						<div
							key={s.setNumber}
							className="font-mono text-sm text-neutral-300 py-1"
						>
							Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}-
							{s.rpeMax}
						</div>
					))}
				</div>
				{variationDisplayWeight != null && (
					<p className="text-xs text-neutral-500">
						Last session:{" "}
						<span className="text-indigo-400 font-mono">
							{variationDisplayWeight} {unit}
						</span>
					</p>
				)}
			</div>

			{/* Accessories */}
			{plan.accessories.map((acc, i) => {
				const accKey = `${acc.category}-${i}`;
				const accOptions = exerciseOptionsLookup[acc.category] ?? [];
				const accDisplayWeight = acc.lastSession?.weight ?? acc.preferredWeight;
				return (
					<div
						key={accKey}
						className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-3"
					>
						<h2 className="text-lg font-semibold text-neutral-100">
							{acc.category
								.replace(/_/g, " ")
								.replace(/\b\w/g, (c) => c.toUpperCase())}
						</h2>
						<select
							value={selections[accKey]}
							onChange={(e) =>
								updateSelection(accKey, `${acc.category}-${i}`, e.target.value)
							}
							className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none"
						>
							{accOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
						<div className="space-y-1">
							{acc.sets.map((s) => (
								<div
									key={s.setNumber}
									className="font-mono text-sm text-neutral-300 py-1"
								>
									Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}
									-{s.rpeMax}
								</div>
							))}
						</div>
						{accDisplayWeight != null && (
							<p className="text-xs text-neutral-500">
								Last session:{" "}
								<span className="text-indigo-400 font-mono">
									{accDisplayWeight} {unit}
								</span>
							</p>
						)}
					</div>
				);
			})}

			{/* Start Button */}
			<button
				type="button"
				onClick={() => onStart(selections)}
				className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg px-4 py-2.5 font-medium transition-colors min-h-20 text-xl w-full"
			>
				Start Workout
			</button>
		</div>
	);
}
