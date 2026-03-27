import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
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

const LIFTS = [
	{ key: "squat" as const, label: "Squat", field: "squat1rm" as const },
	{ key: "bench" as const, label: "Bench Press", field: "bench1rm" as const },
	{
		key: "deadlift" as const,
		label: "Deadlift",
		field: "deadlift1rm" as const,
	},
	{
		key: "ohp" as const,
		label: "Overhead Press",
		field: "ohp1rm" as const,
	},
];

export default function WeightManagement({ cycle }: WeightManagementProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="w-full max-w-md mx-auto mt-8">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900 rounded-xl text-zinc-100 hover:bg-zinc-800 transition-colors"
			>
				<span className="font-semibold">Weight Management</span>
				<span className="text-zinc-400">{isOpen ? "\u25B2" : "\u25BC"}</span>
			</button>

			{isOpen && (
				<div className="mt-2 space-y-4">
					<OneRmSection cycle={cycle} />
					<SavedWeightsSection />
				</div>
			)}
		</div>
	);
}

function OneRmSection({ cycle }: { cycle: WeightManagementProps["cycle"] }) {
	const update1rm = useAtomSet(update1rmAtom, { mode: "promiseExit" });
	const refreshCycle = useAtomRefresh(currentCycleAtom);
	const [editingLift, setEditingLift] = useState<string | null>(null);
	const [editValue, setEditValue] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleEdit = (key: string, currentValue: number | null) => {
		setEditingLift(key);
		setEditValue(currentValue != null ? String(currentValue) : "");
	};

	const handleSave = async (key: string) => {
		const parsed = Number(editValue);
		if (Number.isNaN(parsed) || parsed <= 0) return;

		setIsSaving(true);
		const exit = await update1rm({
			payload: {
				lift: key as "squat" | "bench" | "deadlift" | "ohp",
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
		<div className="bg-zinc-900 rounded-xl p-4">
			<h3 className="text-sm font-semibold text-zinc-400 mb-3">Your 1RMs</h3>
			<div className="space-y-2">
				{LIFTS.map(({ key, label, field }) => {
					const value = cycle[field];
					const isEditing = editingLift === key;

					return (
						<div
							key={key}
							className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
						>
							<span className="text-zinc-100 text-sm">{label}</span>
							{isEditing ? (
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										className="w-20 px-2 py-1 bg-zinc-800 text-zinc-100 rounded text-sm text-right"
										min={0}
										step={0.5}
									/>
									<span className="text-zinc-500 text-xs">{cycle.unit}</span>
									<button
										type="button"
										onClick={() => handleSave(key)}
										disabled={isSaving}
										className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-500 disabled:opacity-50"
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
									<span className="text-zinc-300 text-sm">
										{value != null ? `${value} ${cycle.unit}` : "Not set"}
									</span>
									<button
										type="button"
										onClick={() => handleEdit(key, value)}
										className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded hover:bg-zinc-700 hover:text-zinc-200"
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
			<div className="bg-zinc-900 rounded-xl p-4">
				<h3 className="text-sm font-semibold text-zinc-400 mb-3">
					Saved Weights
				</h3>
				<p className="text-zinc-500 text-sm">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="bg-zinc-900 rounded-xl p-4">
				<h3 className="text-sm font-semibold text-zinc-400 mb-3">
					Saved Weights
				</h3>
				<p className="text-red-400 text-sm">Failed to load saved weights.</p>
			</div>
		);
	}

	const weights = (
		result.value as readonly {
			readonly id: string;
			readonly exerciseName: string;
			readonly weight: number;
			readonly unit: string;
			readonly rpe: number | null;
		}[]
	).slice();

	return (
		<div className="bg-zinc-900 rounded-xl p-4">
			<h3 className="text-sm font-semibold text-zinc-400 mb-3">
				Saved Weights
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
							className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
						>
							<span className="text-zinc-100 text-sm">{w.exerciseName}</span>
							<div className="flex items-center gap-2">
								<span className="text-zinc-300 text-sm">
									{w.weight} {w.unit}
								</span>
								<button
									type="button"
									onClick={() => handleDelete(w.exerciseName)}
									disabled={deletingName === w.exerciseName}
									className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded hover:bg-red-900 hover:text-red-300 disabled:opacity-50"
								>
									{deletingName === w.exerciseName ? "..." : "Delete"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
