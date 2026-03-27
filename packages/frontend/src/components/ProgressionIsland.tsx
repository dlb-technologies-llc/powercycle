import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { CycleProgressionResult } from "@powercycle/shared";
import { calculateCycleProgression } from "@powercycle/shared";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom, startNextCycleAtom } from "../atoms/cycles";

interface CycleData {
	id: string;
	cycleNumber: number;
	currentRound: number;
	currentDay: number;
	squat1rm: number | null;
	bench1rm: number | null;
	deadlift1rm: number | null;
	ohp1rm: number | null;
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

	const result = useAtomValue(currentCycleAtom);
	const startNextCycle = useAtomSet(startNextCycleAtom, {
		mode: "promiseExit",
	});

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-red-400">Failed to load cycle data.</p>
			</div>
		);
	}

	const cycle = result.value as CycleData | null;

	if (!cycle) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-zinc-400">Loading...</p>
			</div>
		);
	}

	const liftsWithData = LIFTS.filter(
		({ key }) => cycle[`${key}1rm` as keyof CycleData] != null,
	);

	const handleCalculate = () => {
		const round3: Record<string, { weight: number; reps: number }> = {};
		const currentLifts: Record<string, number> = {};
		for (const { key } of LIFTS) {
			const rm = cycle[`${key}1rm` as keyof CycleData] as number | null;
			if (rm == null) continue;
			round3[key] = {
				weight: Number(results[key].weight),
				reps: Number(results[key].reps),
			};
			currentLifts[key] = rm;
		}
		setProgression(
			calculateCycleProgression(
				round3 as Parameters<typeof calculateCycleProgression>[0],
				currentLifts as Parameters<typeof calculateCycleProgression>[1],
			),
		);
	};

	const handleStartNext = async () => {
		if (!progression) return;
		setIsStarting(true);
		const exit = await startNextCycle({
			payload: {
				squat: progression.squat?.newMax ?? null,
				bench: progression.bench?.newMax ?? null,
				deadlift: progression.deadlift?.newMax ?? null,
				ohp: progression.ohp?.newMax ?? null,
				unit: cycle.unit || "lbs",
			},
		});
		Exit.match(exit, {
			onFailure: () => {
				console.error("Failed to start next cycle");
				setIsStarting(false);
			},
			onSuccess: () => {
				window.location.href = "/";
			},
		});
	};

	return (
		<div>
			<h1 className="text-2xl font-bold mb-2">Cycle Complete</h1>
			<p className="text-zinc-400 mb-6">
				Enter your Round 3 AMRAP results to calculate new maxes.
			</p>

			{!progression ? (
				liftsWithData.length === 0 ? (
					<div className="text-center">
						<p className="text-zinc-400">
							No 1RMs recorded this cycle. Start a new cycle to begin tracking.
						</p>
						<a href="/" className="text-zinc-100 underline mt-4 inline-block">
							Back to Dashboard
						</a>
					</div>
				) : (
					<div className="space-y-4">
						{liftsWithData.map(({ key, label }) => (
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
				)
			) : (
				<div className="space-y-4">
					{LIFTS.filter(({ key }) => progression[key]).map(({ key, label }) => {
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
