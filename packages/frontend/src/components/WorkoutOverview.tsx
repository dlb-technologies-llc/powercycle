import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { update1rmAtom } from "../atoms/cycles";
import { nextWorkoutAtom } from "../atoms/workouts";

const LIFT_DISPLAY_NAMES: Record<string, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

const DAY_NAMES: Record<string, string> = {
	squat: "Squat Day",
	bench: "Bench Day",
	deadlift: "Deadlift Day",
	ohp: "OHP Day",
};

interface WorkoutOverviewProps {
	plan: {
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
			preferredWeight?: number | null;
			lastSession?: {
				weight: number | null;
				reps: number | null;
				rpe: number | null;
			} | null;
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
			preferredWeight?: number | null;
			lastSession?: {
				weight: number | null;
				reps: number | null;
				rpe: number | null;
			} | null;
			sets: Array<{
				setNumber: number;
				rpeMin: number;
				rpeMax: number;
				repMin: number;
				repMax: number;
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
				lift: plan.mainLift as "squat" | "bench" | "deadlift" | "ohp",
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

	const variationOptions =
		(EXERCISE_OPTIONS as Record<string, readonly string[]>)[
			plan.variation.category
		] ?? [];

	// Determine the best weight to show for variation
	const variationDisplayWeight =
		plan.variation.lastSession?.weight ?? plan.variation.preferredWeight;

	return (
		<div className="space-y-6 animate-fade-in">
			{/* Title */}
			<div>
				<h1 className="text-4xl font-[family-name:var(--font-heading)] uppercase gradient-text-cyan font-bold">
					{dayName}
				</h1>
				<p className="text-zinc-500 text-sm mt-1">
					Cycle {plan.cycle} &middot; Round {plan.round}
				</p>
			</div>

			{/* Main Lift Section */}
			{plan.mainLiftSets.length === 0 ? (
				<div className="glass-card p-5 space-y-3">
					<h2 className="text-lg font-[family-name:var(--font-heading)] font-bold text-zinc-100 uppercase">
						{mainLiftName}
					</h2>
					<p className="text-zinc-400 text-sm">
						Enter your 1RM for {mainLiftName} to calculate your sets.
					</p>
					<div className="flex gap-3">
						<input
							type="number"
							value={oneRmInput}
							onChange={(e) => setOneRmInput(e.target.value)}
							placeholder={`1RM in ${unit}`}
							className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-cyan-500 focus:ring-1 focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleSubmit1rm}
							disabled={isSubmitting1rm}
							className="btn-gradient-cyan px-6 py-2 rounded-xl disabled:opacity-50"
						>
							{isSubmitting1rm ? "Saving..." : "Save"}
						</button>
					</div>
					{oneRmError && <p className="text-red-400 text-sm">{oneRmError}</p>}
				</div>
			) : (
				<div className="glass-card p-5 space-y-3">
					<h2 className="text-lg font-[family-name:var(--font-heading)] font-bold text-zinc-100 uppercase">
						{mainLiftName}
					</h2>
					<div className="space-y-1">
						{plan.mainLiftSets.map((s) => (
							<div
								key={s.setNumber}
								className="flex items-center justify-between text-sm text-zinc-300 py-1.5"
							>
								<span className="font-[family-name:var(--font-mono)]">
									Set {s.setNumber}: {s.weight} {unit} &times; {s.reps}
									{s.isAmrap ? "+" : ""}
								</span>
								{s.isAmrap && (
									<span className="text-xs bg-red-500/20 text-red-400 rounded px-2 py-0.5">
										AMRAP
									</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Variation Section */}
			<div className="glass-card p-5 space-y-3">
				<h2 className="text-lg font-[family-name:var(--font-heading)] font-bold text-zinc-100 uppercase">
					Variation
				</h2>
				<select
					value={selections[variationKey]}
					onChange={(e) =>
						updateSelection(
							variationKey,
							`${plan.variation.category}-variation`,
							e.target.value,
						)
					}
					className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-cyan-500 focus:ring-1 focus:outline-none"
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
							className="text-sm text-zinc-300 py-1 font-[family-name:var(--font-mono)]"
						>
							Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}-
							{s.rpeMax}
						</div>
					))}
				</div>
				{variationDisplayWeight != null && (
					<p className="text-cyan-500 font-[family-name:var(--font-mono)] text-sm">
						Last: {variationDisplayWeight} {unit}
					</p>
				)}
			</div>

			{/* Accessories */}
			{plan.accessories.map((acc, i) => {
				const accKey = `${acc.category}-${i}`;
				const accOptions =
					(EXERCISE_OPTIONS as Record<string, readonly string[]>)[
						acc.category
					] ?? [];
				const accDisplayWeight = acc.lastSession?.weight ?? acc.preferredWeight;
				return (
					<div key={accKey} className="glass-card p-5 space-y-3">
						<h2 className="text-lg font-[family-name:var(--font-heading)] font-bold text-zinc-100 uppercase">
							{acc.category
								.replace(/_/g, " ")
								.replace(/\b\w/g, (c) => c.toUpperCase())}
						</h2>
						<select
							value={selections[accKey]}
							onChange={(e) =>
								updateSelection(accKey, `${acc.category}-${i}`, e.target.value)
							}
							className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-3 py-2 text-zinc-100 focus:ring-cyan-500 focus:ring-1 focus:outline-none"
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
									className="text-sm text-zinc-300 py-1 font-[family-name:var(--font-mono)]"
								>
									Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}
									-{s.rpeMax}
								</div>
							))}
						</div>
						{accDisplayWeight != null && (
							<p className="text-cyan-500 font-[family-name:var(--font-mono)] text-sm">
								Last: {accDisplayWeight} {unit}
							</p>
						)}
					</div>
				);
			})}

			{/* Start Button */}
			<button
				type="button"
				onClick={() => onStart(selections)}
				className="btn-gradient-cyan min-h-20 rounded-2xl text-xl w-full"
			>
				Start Workout
			</button>
		</div>
	);
}
