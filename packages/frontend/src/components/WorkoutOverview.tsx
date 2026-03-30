import { useAtomRefresh, useAtomSet } from "@effect/atom-react";
import {
	LIFT_DISPLAY_NAMES,
	type MainLift,
} from "@powercycle/shared/schema/lifts";
import { EXERCISE_OPTIONS } from "@powercycle/shared/schema/workout";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { update1rmAtom } from "../atoms/cycles";
import { nextWorkoutAtom } from "../atoms/workouts";

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
	onStart: (
		selections: Record<string, string>,
		skippedExercises: ReadonlySet<string>,
	) => void;
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

	const [skippedExercises, setSkippedExercises] = useState<Set<string>>(
		() => new Set(),
	);

	const toggleSkip = (exerciseKey: string) => {
		setSkippedExercises((prev) => {
			const next = new Set(prev);
			if (next.has(exerciseKey)) {
				next.delete(exerciseKey);
			} else {
				next.add(exerciseKey);
			}
			return next;
		});
	};

	useEffect(() => {
		fetch("/api/preferences/exercises")
			.then((res) => res.json())
			.then((prefs: Array<{ slotKey: string; exerciseName: string }>) => {
				if (prefs.length > 0) {
					const updates: Record<string, string> = {};
					for (const p of prefs) {
						updates[p.slotKey] = p.exerciseName;
						// Sync API -> localStorage
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

	const isVariationSkipped = skippedExercises.has(variationKey);

	return (
		<div className="space-y-6">
			{/* Title */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">{dayName}</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Cycle {plan.cycle} &middot; Round {plan.round}
				</p>
			</div>

			{/* Main Lift Section */}
			{plan.mainLiftSets.length === 0 ? (
				<Card className="p-5 gap-3">
					<CardContent className="space-y-3 p-0">
						<h2 className="text-lg font-semibold text-foreground">
							{mainLiftName}
						</h2>
						<p className="text-sm text-muted-foreground">
							Enter your 1RM for {mainLiftName} to calculate your sets.
						</p>
						<div className="flex gap-3">
							<Input
								type="number"
								value={oneRmInput}
								onChange={(e) => setOneRmInput(e.target.value)}
								placeholder={`1RM in ${unit}`}
								className={cn("font-mono", "flex-1")}
							/>
							<Button
								type="button"
								onClick={handleSubmit1rm}
								disabled={isSubmitting1rm}
								className="px-4 py-2.5"
							>
								{isSubmitting1rm ? "Saving..." : "Save"}
							</Button>
						</div>
						{oneRmError && (
							<p className="text-destructive text-sm">{oneRmError}</p>
						)}
					</CardContent>
				</Card>
			) : (
				<Card className="p-5 gap-3">
					<CardContent className="space-y-3 p-0">
						<h2 className="text-lg font-semibold text-foreground">
							{mainLiftName}
						</h2>
						<div className="space-y-1">
							{plan.mainLiftSets.map((s) => (
								<div
									key={s.setNumber}
									className="flex items-center justify-between text-sm text-muted-foreground py-1.5"
								>
									<span className="font-mono text-sm text-foreground">
										Set {s.setNumber}: {s.weight} {unit} &times; {s.reps}
										{s.isAmrap ? "+" : ""}
									</span>
									{s.isAmrap && <Badge variant="destructive">AMRAP</Badge>}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Variation Section */}
			<Card className="p-5 gap-3">
				<CardContent className="space-y-3 p-0">
					<div className="flex items-center justify-between">
						<h2
							className={cn(
								"text-lg font-semibold",
								isVariationSkipped
									? "text-muted-foreground line-through"
									: "text-foreground",
							)}
						>
							Variation
						</h2>
						<div className="flex items-center gap-2">
							{isVariationSkipped && <Badge variant="secondary">Skipped</Badge>}
							<Button
								variant="ghost"
								type="button"
								onClick={() => toggleSkip(variationKey)}
								className="text-sm"
							>
								{isVariationSkipped ? "Undo" : "Skip"}
							</Button>
						</div>
					</div>
					{!isVariationSkipped && (
						<>
							<select
								value={selections[variationKey]}
								onChange={(e) =>
									updateSelection(
										variationKey,
										`${plan.variation.category}-variation`,
										e.target.value,
									)
								}
								className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
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
										className="font-mono text-sm text-muted-foreground py-1"
									>
										Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE{" "}
										{s.rpeMin}-{s.rpeMax}
									</div>
								))}
							</div>
							{variationDisplayWeight != null && (
								<p className="text-xs text-muted-foreground">
									Last session:{" "}
									<span className="font-mono font-medium text-foreground">
										{variationDisplayWeight} {unit}
									</span>
								</p>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Accessories */}
			{plan.accessories.map((acc, i) => {
				const accKey = `${acc.category}-${i}`;
				const accOptions = exerciseOptionsLookup[acc.category] ?? [];
				const accDisplayWeight = acc.lastSession?.weight ?? acc.preferredWeight;
				const isSkipped = skippedExercises.has(accKey);
				return (
					<Card key={accKey} className="p-5 gap-3">
						<CardContent className="space-y-3 p-0">
							<div className="flex items-center justify-between">
								<h2
									className={cn(
										"text-lg font-semibold",
										isSkipped
											? "text-muted-foreground line-through"
											: "text-foreground",
									)}
								>
									{acc.category
										.replace(/_/g, " ")
										.replace(/\b\w/g, (c) => c.toUpperCase())}
								</h2>
								<div className="flex items-center gap-2">
									{isSkipped && <Badge variant="secondary">Skipped</Badge>}
									<Button
										variant="ghost"
										type="button"
										onClick={() => toggleSkip(accKey)}
										className="text-sm"
									>
										{isSkipped ? "Undo" : "Skip"}
									</Button>
								</div>
							</div>
							{!isSkipped && (
								<>
									<select
										value={selections[accKey]}
										onChange={(e) =>
											updateSelection(
												accKey,
												`${acc.category}-${i}`,
												e.target.value,
											)
										}
										className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
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
												className="font-mono text-sm text-muted-foreground py-1"
											>
												Set {s.setNumber}: {s.repMin}-{s.repMax} reps @ RPE{" "}
												{s.rpeMin}-{s.rpeMax}
											</div>
										))}
									</div>
									{accDisplayWeight != null && (
										<p className="text-xs text-muted-foreground">
											Last session:{" "}
											<span className="font-mono font-medium text-foreground">
												{accDisplayWeight} {unit}
											</span>
										</p>
									)}
								</>
							)}
						</CardContent>
					</Card>
				);
			})}

			{/* Start Button */}
			<Button
				size="lg"
				type="button"
				onClick={() => onStart(selections, skippedExercises)}
				className="w-full min-h-20 text-xl"
			>
				Start workout
			</Button>
		</div>
	);
}
