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
			<div className="card !p-0 overflow-hidden">
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-full flex items-center justify-between px-6 py-4 text-black hover:bg-gray-50 transition-colors"
				>
					<span className="font-semibold">Weight management</span>
					<span
						className={`text-gray-400 transition-transform duration-200 inline-block ${isOpen ? "rotate-180" : ""}`}
					>
						&#x25BC;
					</span>
				</button>

				{isOpen && (
					<div className="px-6 pb-6 space-y-4">
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
			<h3 className="label mb-3">Your 1RMs</h3>
			<div className="space-y-2">
				{LIFTS.map(({ key, label, field }) => {
					const value = cycle[field];
					const isEditing = editingLift === key;

					return (
						<div
							key={key}
							className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
						>
							<span className="text-black text-sm">{label}</span>
							{isEditing ? (
								<div className="flex items-center gap-2">
									<input
										type="number"
										value={editValue}
										onChange={(e) => setEditValue(e.target.value)}
										className="input w-20 text-right font-mono"
										min={0}
										step={0.5}
									/>
									<span className="text-gray-500 text-xs">{cycle.unit}</span>
									<button
										type="button"
										onClick={() => handleSave(key)}
										disabled={isSaving}
										className="btn-secondary !px-2 !py-1 !text-xs disabled:opacity-50"
									>
										{isSaving ? "..." : "Save"}
									</button>
									<button
										type="button"
										onClick={() => setEditingLift(null)}
										className="btn-ghost !px-2 !py-1 !text-xs"
									>
										Cancel
									</button>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<span className="text-gray-600 text-sm font-mono font-bold">
										{value != null ? `${value} ${cycle.unit}` : "Not set"}
									</span>
									<button
										type="button"
										onClick={() => handleEdit(key, value)}
										className="btn-secondary !px-2 !py-1 !text-xs min-h-[48px] min-w-[48px]"
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
				<h3 className="label mb-3">Saved weights</h3>
				<p className="text-gray-400 text-sm">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div>
				<h3 className="label mb-3">Saved weights</h3>
				<p className="text-gray-500 text-sm">Failed to load saved weights.</p>
			</div>
		);
	}

	const weights = [...result.value];

	return (
		<div>
			<h3 className="label mb-3">Saved weights</h3>
			{weights.length === 0 ? (
				<p className="text-gray-400 text-sm">
					Weights will be saved as you complete workouts
				</p>
			) : (
				<div className="space-y-2">
					{weights.map((w) => (
						<div
							key={w.id}
							className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
						>
							<span className="text-black text-sm">{w.exerciseName}</span>
							<div className="flex items-center gap-2">
								<span className="text-gray-600 text-sm font-mono font-bold">
									{w.weight} {w.unit}
								</span>
								<button
									type="button"
									onClick={() => handleDelete(w.exerciseName)}
									disabled={deletingName === w.exerciseName}
									className="btn-ghost !text-red-600 hover:!text-red-700 hover:!bg-red-50 min-h-[48px] min-w-[48px] disabled:opacity-50"
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
