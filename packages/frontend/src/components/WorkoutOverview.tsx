import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { useEffect, useState } from "react";

const LIFT_DISPLAY_NAMES: Record<string, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
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
	const variationOptions =
		(EXERCISE_OPTIONS as Record<string, readonly string[]>)[
			plan.variation.category
		] ?? [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-100">
					Day {plan.day} &middot; Round {plan.round}
				</h1>
				<p className="text-zinc-400 text-lg mt-1">{mainLiftName}</p>
			</div>

			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-zinc-100">{mainLiftName}</h2>
				<div className="space-y-1">
					{plan.mainLiftSets.map((s) => (
						<div
							key={s.setNumber}
							className="flex items-center justify-between text-sm text-zinc-300 py-1"
						>
							<span>
								Set {s.setNumber}: {s.weight} {unit} &times; {s.reps}
								{s.isAmrap ? "+" : ""}
							</span>
							{s.isAmrap && (
								<span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
									AMRAP
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="space-y-3">
				<h2 className="text-lg font-semibold text-zinc-100">Variation</h2>
				<select
					value={selections[variationKey]}
					onChange={(e) =>
						updateSelection(
							variationKey,
							`${plan.variation.category}-variation`,
							e.target.value,
						)
					}
					className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
				>
					{variationOptions.map((opt) => (
						<option key={opt} value={opt}>
							{opt}
						</option>
					))}
				</select>
				<div className="space-y-1">
					{plan.variation.sets.map((s) => (
						<div key={s.setNumber} className="text-sm text-zinc-300 py-1">
							Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}-
							{s.rpeMax}
						</div>
					))}
				</div>
			</div>

			{plan.accessories.map((acc, i) => {
				const accKey = `${acc.category}-${i}`;
				const accOptions =
					(EXERCISE_OPTIONS as Record<string, readonly string[]>)[
						acc.category
					] ?? [];
				return (
					<div key={accKey} className="space-y-3">
						<h2 className="text-lg font-semibold text-zinc-100">
							{acc.category
								.replace(/_/g, " ")
								.replace(/\b\w/g, (c) => c.toUpperCase())}
						</h2>
						<select
							value={selections[accKey]}
							onChange={(e) =>
								updateSelection(accKey, `${acc.category}-${i}`, e.target.value)
							}
							className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
						>
							{accOptions.map((opt) => (
								<option key={opt} value={opt}>
									{opt}
								</option>
							))}
						</select>
						<div className="space-y-1">
							{acc.sets.map((s) => (
								<div key={s.setNumber} className="text-sm text-zinc-300 py-1">
									Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE {s.rpeMin}
									-{s.rpeMax}
								</div>
							))}
						</div>
					</div>
				);
			})}

			<button
				type="button"
				onClick={() => onStart(selections)}
				className="w-full min-h-[48px] bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-500 transition-colors"
			>
				Start Workout
			</button>
		</div>
	);
}
