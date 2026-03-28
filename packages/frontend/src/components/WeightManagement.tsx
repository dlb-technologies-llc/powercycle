import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import type { MainLift } from "@powercycle/shared/schema/lifts";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom, update1rmAtom } from "../atoms/cycles";
import {
	deleteExerciseWeightAtom,
	exerciseWeightsAtom,
} from "../atoms/exercise-weights";

interface WeightManagementProps {
	cycle: {
		squat1rm: number | null;
		bench1rm: number | null;
		deadlift1rm: number | null;
		ohp1rm: number | null;
		unit: string;
	};
}

const LIFTS: ReadonlyArray<{
	key: MainLift;
	label: string;
	field: `${MainLift}1rm`;
}> = [
	{ key: "squat", label: "Squat", field: "squat1rm" },
	{ key: "bench", label: "Bench Press", field: "bench1rm" },
	{ key: "deadlift", label: "Deadlift", field: "deadlift1rm" },
	{ key: "ohp", label: "Overhead Press", field: "ohp1rm" },
];

export default function WeightManagement({ cycle }: WeightManagementProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full max-w-md mx-auto mt-8">
			<div className="glass-card overflow-hidden">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-full flex items-center justify-between px-6 py-4 text-zinc-100 hover:bg-white/5 transition-colors"
				>
					<span className="font-[family-name:var(--font-heading)] uppercase tracking-wider font-bold">
						WEIGHT MANAGEMENT
					</span>
					<span
						className="text-zinc-400 transition-transform duration-300"
						style={{
							display: "inline-block",
							transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
						}}
					>
						&#x25BC;
					</span>
				</button>

				{isOpen && (
					<div className="px-6 pb-6 space-y-4 animate-fade-in">
						<OneRmSection cycle={cycle} />
						<SavedWeightsSection />
					</div>
				)}
			</div>
		</div>
	);
}

function OneRmSection({ cycle }: { cycle: WeightManagementProps["cycle"] }) {
	const update1rm = useAtomSet(update1rmAtom, { mode: "promiseExit" });
	const refreshCycle = useAtomRefresh(currentCycleAtom);
	const [editingLift, setEditingLift] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleEdit = (key: MainLift, currentValue: number | null) => {
		setEditingLift(key);
		setEditValue(currentValue != null ? String(currentValue) : "");
	};

	const handleSave = async (key: MainLift) => {
		const parsed = Number(editValue);
		if (Number.isNaN(parsed) || parsed <= 0) return;

		setIsSaving(true);
		const exit = await update1rm({
			payload: {
				lift: key,
				value: parsed,
			},
		});
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to update 1RM");
				setIsSaving(false);
			},
			onSuccess: () => {
				refreshCycle();
				setEditingLift(null);
				setIsSaving(false);
			},
		});
	};

	return (
		<div>
			<h3 className="text-xs font-[family-name:var(--font-heading)] uppercase tracking-wider text-zinc-400 mb-3">
				YOUR 1RMS
			</h3>
			<div className="space-y-2">
				{LIFTS.map(({ key, label, field }) => {
					const value = cycle[field];
					const isEditing = editingLift === key;

					return (
						<div
							key={key}
							className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
						>
							<span className="text-zinc-100 text-sm">{label}</span>
							{isEditing ? (
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										className="w-20 px-2 py-1 bg-zinc-800 text-zinc-100 rounded text-sm text-right font-[family-name:var(--font-mono)] focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
										min={0}
										step={0.5}
									/>
									<span className="text-zinc-500 text-xs">{cycle.unit}</span>
									<button
										type="button"
										onClick={() => handleSave(key)}
										disabled={isSaving}
										className="px-2 py-1 bg-accent-cyan text-white text-xs rounded hover:brightness-110 disabled:opacity-50 transition-all"
									>
										{isSaving ? "..." : "Save"}
									</button>
									<button
										type="button"
										onClick={() => setEditingLift(null)}
										className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded hover:bg-zinc-600"
									>
										Cancel
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<span className="text-zinc-300 text-sm font-[family-name:var(--font-mono)] font-bold">
										{value != null ? `${value} ${cycle.unit}` : "Not set"}
									</span>
									<button
										type="button"
										onClick={() => handleEdit(key, value)}
										className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 hover:text-zinc-200 min-h-[48px] min-w-[48px] flex items-center justify-center"
									>
										Edit
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function SavedWeightsSection() {
	const result = useAtomValue(exerciseWeightsAtom);
	const refreshWeights = useAtomRefresh(exerciseWeightsAtom);
	const deleteWeight = useAtomSet(deleteExerciseWeightAtom, {
		mode: "promiseExit",
	});
	const [deletingName, setDeletingName] = useState<string | null>(null);

	const handleDelete = async (exerciseName: string) => {
		setDeletingName(exerciseName);
		const exit = await deleteWeight({
			params: { exerciseName },
		});
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to delete exercise weight");
				setDeletingName(null);
			},
			onSuccess: () => {
				refreshWeights();
				setDeletingName(null);
			},
		});
	};

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div>
				<h3 className="text-xs font-[family-name:var(--font-heading)] uppercase tracking-wider text-zinc-400 mb-3">
					SAVED WEIGHTS
				</h3>
				<p className="text-zinc-500 text-sm">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div>
				<h3 className="text-xs font-[family-name:var(--font-heading)] uppercase tracking-wider text-zinc-400 mb-3">
					SAVED WEIGHTS
				</h3>
				<p className="text-zinc-400 text-sm">Failed to load saved weights.</p>
			</div>
		);
	}

	const weights = [...result.value];

	return (
		<div>
			<h3 className="text-xs font-[family-name:var(--font-heading)] uppercase tracking-wider text-zinc-400 mb-3">
				SAVED WEIGHTS
			</h3>
			{weights.length === 0 ? (
				<p className="text-zinc-500 text-sm">
					Weights will be saved as you complete workouts
				</p>
			) : (
				<div className="space-y-2">
					{weights.map((w) => (
						<div
							key={w.id}
							className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
						>
							<span className="text-zinc-100 text-sm">{w.exerciseName}</span>
							<div className="flex items-center gap-2">
								<span className="text-zinc-300 text-sm font-[family-name:var(--font-mono)] font-bold">
									{w.weight} {w.unit}
								</span>
								<button
									type="button"
									onClick={() => handleDelete(w.exerciseName)}
									disabled={deletingName === w.exerciseName}
									className="w-8 h-8 min-h-[48px] min-w-[48px] flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50"
								>
									{deletingName === w.exerciseName ? "..." : "\u00D7"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
