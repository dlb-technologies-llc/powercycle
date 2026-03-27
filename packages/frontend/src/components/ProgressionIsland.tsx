import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { CycleProgressionResult } from "@powercycle/shared";
import { calculateCycleProgression } from "@powercycle/shared";
import type { CycleResponse } from "@powercycle/shared/schema/api";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom, startNextCycleAtom } from "../atoms/cycles";

type CycleData = typeof CycleResponse.Type;

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
				unit: cycle.unit,
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
			<h1 className="text-2xl font-[family-name:var(--font-heading)] uppercase tracking-wider gradient-text-green mb-2">
				Cycle Complete
			</h1>
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
							<div key={key} className="glass-card p-5">
								<p className="font-[family-name:var(--font-heading)] uppercase text-sm mb-1">
									{label}
								</p>
								<p className="text-sm text-zinc-500 mb-3">
									current 1RM:{" "}
									<span className="font-[family-name:var(--font-mono)]">
										{cycle[`${key}1rm` as keyof CycleData]}
									</span>
								</p>
								<div className="grid grid-cols-2 gap-3">
									<label className="block">
										<span className="text-xs text-zinc-500 uppercase block mb-1">
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
											className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 font-[family-name:var(--font-mono)] text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
										/>
									</label>
									<label className="block">
										<span className="text-xs text-zinc-500 uppercase block mb-1">
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
											className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 font-[family-name:var(--font-mono)] text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
										/>
									</label>
								</div>
							</div>
						))}
						<button
							type="button"
							onClick={handleCalculate}
							className="w-full btn-gradient-cyan min-h-16 rounded-2xl text-lg"
						>
							Calculate New Maxes
						</button>
					</div>
				)
			) : (
				<div className="space-y-4">
					{LIFTS.filter(({ key }) => progression[key]).map(
						({ key, label }, index) => {
							const p = progression[key];
							return (
								<div
									key={key}
									className="glass-card p-5 flex items-center justify-between animate-fade-in"
									style={{ animationDelay: `${index * 80}ms` }}
								>
									<div>
										<p className="font-[family-name:var(--font-heading)] uppercase">
											{label}
										</p>
										<p className="text-sm text-zinc-400">
											<span className="font-[family-name:var(--font-mono)]">
												{p.currentMax}
											</span>
											{" → "}
											<span className="font-[family-name:var(--font-mono)]">
												{p.newMax}
											</span>
										</p>
									</div>
									<div
										className={`text-lg font-bold font-[family-name:var(--font-mono)] ${p.progressed ? "text-green-400" : "text-amber-400"}`}
									>
										{p.progressed ? `+${p.newMax - p.currentMax}` : "Same"}
									</div>
								</div>
							);
						},
					)}
					<button
						type="button"
						onClick={handleStartNext}
						disabled={isStarting}
						className="w-full btn-gradient-green min-h-16 rounded-2xl text-lg disabled:opacity-50"
					>
						{isStarting ? "Starting..." : "Start Next Cycle"}
					</button>
				</div>
			)}
		</div>
	);
}
