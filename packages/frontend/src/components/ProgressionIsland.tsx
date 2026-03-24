import type { CycleProgressionResult } from "@powercycle/shared";
import { calculateCycleProgression } from "@powercycle/shared";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface CycleData {
	id: string;
	cycleNumber: number;
	currentRound: number;
	currentDay: number;
	squat1rm: number;
	bench1rm: number;
	deadlift1rm: number;
	ohp1rm: number;
	unit: string;
	completedAt: string | null;
}

const LIFTS: Array<{
	key: "squat" | "bench" | "deadlift" | "ohp";
	label: string;
}> = [
	{ key: "squat", label: "Squat" },
	{ key: "bench", label: "Bench Press" },
	{ key: "deadlift", label: "Deadlift" },
	{ key: "ohp", label: "Overhead Press" },
];

export default function ProgressionIsland() {
	const [cycle, setCycle] = useState<CycleData | null>(null);
	const [isStarting, setIsStarting] = useState(false);

	const [results, setResults] = useState({
		squat: { weight: "", reps: "" },
		bench: { weight: "", reps: "" },
		deadlift: { weight: "", reps: "" },
		ohp: { weight: "", reps: "" },
	});
	const [progression, setProgression] = useState<CycleProgressionResult | null>(
		null,
	);

	useEffect(() => {
		apiFetch<CycleData | null>("/api/cycles/current")
			.then((data) => setCycle(data))
			.catch(() => {});
	}, []);

	if (!cycle) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading...</p>
			</div>
		);
	}

	const handleCalculate = () => {
		const round3 = {
			squat: {
				weight: Number(results.squat.weight),
				reps: Number(results.squat.reps),
			},
			bench: {
				weight: Number(results.bench.weight),
				reps: Number(results.bench.reps),
			},
			deadlift: {
				weight: Number(results.deadlift.weight),
				reps: Number(results.deadlift.reps),
			},
			ohp: {
				weight: Number(results.ohp.weight),
				reps: Number(results.ohp.reps),
			},
		};
		const currentLifts = {
			squat: cycle.squat1rm,
			bench: cycle.bench1rm,
			deadlift: cycle.deadlift1rm,
			ohp: cycle.ohp1rm,
		};
		setProgression(calculateCycleProgression(round3, currentLifts));
	};

	const handleStartNext = async () => {
		if (!progression) return;
		setIsStarting(true);
		try {
			await apiFetch("/api/cycles/next", {
				method: "POST",
				body: JSON.stringify({
					squat: progression.squat.newMax,
					bench: progression.bench.newMax,
					deadlift: progression.deadlift.newMax,
					ohp: progression.ohp.newMax,
					unit: cycle.unit || "lbs",
				}),
			});
			window.location.href = "/";
		} catch (err) {
			console.error("Failed to start next cycle", err);
			setIsStarting(false);
		}
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-2">Cycle Complete</h1>
			<p className="text-zinc-400 mb-6">
				Enter your Round 3 AMRAP results to calculate new maxes.
			</p>

			{!progression ? (
				<div className="space-y-4">
					{LIFTS.map(({ key, label }) => (
						<div key={key} className="bg-zinc-900 rounded-lg p-4">
							<p className="text-sm text-zinc-400 mb-2">
								{label} (current 1RM: {cycle[`${key}1rm` as keyof CycleData]})
							</p>
							<div className="grid grid-cols-2 gap-3">
								<label className="block">
									<span className="text-xs text-zinc-500 block mb-1">
										Weight @ 95%
									</span>
									<input
										type="number"
										value={results[key].weight}
										onChange={(e) =>
											setResults((r) => ({
												...r,
												[key]: { ...r[key], weight: e.target.value },
											}))
										}
										className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
									/>
								</label>
								<label className="block">
									<span className="text-xs text-zinc-500 block mb-1">
										Reps (1+)
									</span>
									<input
										type="number"
										value={results[key].reps}
										onChange={(e) =>
											setResults((r) => ({
												...r,
												[key]: { ...r[key], reps: e.target.value },
											}))
										}
										className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
									/>
								</label>
							</div>
						</div>
					))}
					<button
						type="button"
						onClick={handleCalculate}
						className="w-full py-4 bg-zinc-100 text-zinc-900 font-bold text-lg rounded-xl hover:bg-zinc-200 transition-colors"
					>
						Calculate New Maxes
					</button>
				</div>
			) : (
				<div className="space-y-4">
					{LIFTS.map(({ key, label }) => {
						const p = progression[key];
						return (
							<div
								key={key}
								className="bg-zinc-900 rounded-lg p-4 flex items-center justify-between"
							>
								<div>
									<p className="font-medium">{label}</p>
									<p className="text-sm text-zinc-400">
										{p.currentMax} → {p.newMax}
									</p>
								</div>
								<div
									className={`text-lg font-bold ${p.progressed ? "text-green-400" : "text-zinc-500"}`}
								>
									{p.progressed ? `+${p.newMax - p.currentMax}` : "Same"}
								</div>
							</div>
						);
					})}
					<button
						type="button"
						onClick={handleStartNext}
						disabled={isStarting}
						className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-500 disabled:opacity-50 transition-colors"
					>
						{isStarting ? "Starting..." : "Start Next Cycle"}
					</button>
				</div>
			)}
		</div>
	);
}
