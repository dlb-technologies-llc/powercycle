import { useAtomSet, useAtomValue } from "@effect/atom-react";
import type { CycleProgressionResult } from "@powercycle/shared";
import { calculateCycleProgression } from "@powercycle/shared";
import type { NullableCycleResponse } from "@powercycle/shared/schema/api";
import type { MainLift } from "@powercycle/shared/schema/lifts";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useState } from "react";
import { currentCycleAtom, startNextCycleAtom } from "../atoms/cycles";

type CycleData = NonNullable<typeof NullableCycleResponse.Type>;

type LiftKey = "squat" | "bench" | "deadlift" | "ohp";

function get1rm(cycle: CycleData, key: LiftKey): number | null {
	switch (key) {
		case "squat":
			return cycle.squat1rm;
		case "bench":
			return cycle.bench1rm;
		case "deadlift":
			return cycle.deadlift1rm;
		case "ohp":
			return cycle.ohp1rm;
	}
}

const LIFTS: Array<{ key: LiftKey; label: string }> = [
	{ key: "squat", label: "Squat" },
	{ key: "bench", label: "Bench Press" },
	{ key: "deadlift", label: "Deadlift" },
	{ key: "ohp", label: "Overhead Press" },
];

function progressionColor(p: {
	currentMax: number;
	newMax: number;
	progressed: boolean;
}): string {
	if (p.newMax > p.currentMax) return "text-green-600";
	if (p.newMax < p.currentMax) return "text-red-600";
	return "text-gray-500";
}

function progressionLabel(p: {
	currentMax: number;
	newMax: number;
	progressed: boolean;
}): string {
	const diff = p.newMax - p.currentMax;
	if (diff > 0) return `+${diff}`;
	if (diff < 0) return `${diff}`;
	return "Same";
}

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
				<p className="text-gray-600">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-red-600">Failed to load cycle data.</p>
			</div>
		);
	}

	const cycle = result.value;

	if (!cycle) {
		return (
			<div className="flex items-center justify-center min-h-[60vh]">
				<p className="text-gray-600">Loading...</p>
			</div>
		);
	}

	const liftsWithData = LIFTS.filter(({ key }) => get1rm(cycle, key) != null);

	const handleCalculate = () => {
		const defaultResult = { weight: 0, reps: 0 };
		const round3: Record<MainLift, { weight: number; reps: number }> = {
			squat: defaultResult,
			bench: defaultResult,
			deadlift: defaultResult,
			ohp: defaultResult,
		};
		const currentLifts: Record<MainLift, number> = {
			squat: 0,
			bench: 0,
			deadlift: 0,
			ohp: 0,
		};
		for (const { key } of LIFTS) {
			const rm = get1rm(cycle, key);
			if (rm == null) continue;
			round3[key] = {
				weight: Number(results[key].weight),
				reps: Number(results[key].reps),
			};
			currentLifts[key] = rm;
		}
		setProgression(calculateCycleProgression(round3, currentLifts));
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
			<h1 className="text-2xl font-bold text-black mb-2">Cycle complete</h1>
			<p className="text-gray-600 mb-6">
				Enter your Round 3 AMRAP results to calculate new maxes.
			</p>

			{!progression ? (
				liftsWithData.length === 0 ? (
					<div className="text-center">
						<p className="text-gray-600">
							No 1RMs recorded this cycle. Start a new cycle to begin tracking.
						</p>
						<a href="/" className="text-black underline mt-4 inline-block">
							Back to dashboard
						</a>
					</div>
				) : (
					<div className="space-y-4">
						{liftsWithData.map(({ key, label }) => (
							<div key={key} className="card p-5">
								<p className="text-sm font-medium text-black mb-1">{label}</p>
								<p className="text-sm text-gray-600 mb-3">
									Current 1RM:{" "}
									<span className="font-mono">{get1rm(cycle, key)}</span>
								</p>
								<div className="grid grid-cols-2 gap-3">
									<label className="block">
										<span className="label mb-1">Weight @ 95%</span>
										<input
											type="number"
											value={results[key].weight}
											onChange={(e) =>
												setResults((r) => ({
													...r,
													[key]: { ...r[key], weight: e.target.value },
												}))
											}
											className="input w-full font-mono"
										/>
									</label>
									<label className="block">
										<span className="label mb-1">Reps (1+)</span>
										<input
											type="number"
											value={results[key].reps}
											onChange={(e) =>
												setResults((r) => ({
													...r,
													[key]: { ...r[key], reps: e.target.value },
												}))
											}
											className="input w-full font-mono"
										/>
									</label>
								</div>
							</div>
						))}
						<button
							type="button"
							onClick={handleCalculate}
							className="btn-primary w-full min-h-16 text-lg"
						>
							Calculate new maxes
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
								className="card p-5 flex items-center justify-between"
							>
								<div>
									<p className="text-sm font-medium text-black">{label}</p>
									<p className="text-sm text-gray-600">
										<span className="font-mono">{p.currentMax}</span>
										{" → "}
										<span className="font-mono">{p.newMax}</span>
									</p>
								</div>
								<div
									className={`text-lg font-bold font-mono ${progressionColor(p)}`}
								>
									{progressionLabel(p)}
								</div>
							</div>
						);
					})}
					<button
						type="button"
						onClick={handleStartNext}
						disabled={isStarting}
						className="btn-primary w-full min-h-16 text-lg"
					>
						{isStarting ? "Starting..." : "Start next cycle"}
					</button>
				</div>
			)}
		</div>
	);
}
