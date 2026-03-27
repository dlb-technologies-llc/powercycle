import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { useState } from "react";
import { createCycleAtom } from "../atoms/cycles";

const lifts = [
	{ label: "Squat", delay: 0 },
	{ label: "Bench Press", delay: 100 },
	{ label: "Deadlift", delay: 200 },
	{ label: "Overhead Press", delay: 300 },
] as const;

export default function SetupIsland() {
	const [squat, setSquat] = useState("");
	const [bench, setBench] = useState("");
	const [deadlift, setDeadlift] = useState("");
	const [ohp, setOhp] = useState("");
	const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
	const [error, setError] = useState("");
	const [isPending, setIsPending] = useState(false);

	const createCycle = useAtomSet(createCycleAtom, { mode: "promiseExit" });

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const liftValues = {
			squat: squat ? Number(squat) : null,
			bench: bench ? Number(bench) : null,
			deadlift: deadlift ? Number(deadlift) : null,
			ohp: ohp ? Number(ohp) : null,
			unit,
		};
		// Validate entered values are > 0
		const entered = [
			liftValues.squat,
			liftValues.bench,
			liftValues.deadlift,
			liftValues.ohp,
		].filter((v): v is number => v !== null);
		if (entered.some((v) => v <= 0)) {
			setError("Entered weights must be greater than 0");
			return;
		}
		setIsPending(true);
		const exit = await createCycle({ payload: liftValues });
		Exit.match(exit, {
			onFailure: () => {
				setError("Failed to create cycle");
				setIsPending(false);
			},
			onSuccess: () => {
				window.location.href = "/";
			},
		});
	};

	const liftState = [
		{ value: squat, setter: setSquat },
		{ value: bench, setter: setBench },
		{ value: deadlift, setter: setDeadlift },
		{ value: ohp, setter: setOhp },
	];

	return (
		<div>
			<h1 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase tracking-wider gradient-text-cyan mb-2">
				Set Your Maxes
			</h1>
			<p className="text-zinc-400 mb-8">
				Enter any 1RMs you know — you'll be asked for others when needed.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="inline-flex rounded-full bg-zinc-800/50 border border-zinc-700/50 p-1 mb-6">
					<button
						type="button"
						onClick={() => setUnit("lbs")}
						className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
							unit === "lbs"
								? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
								: "bg-transparent text-zinc-500"
						}`}
					>
						lbs
					</button>
					<button
						type="button"
						onClick={() => setUnit("kg")}
						className={`px-5 py-2 rounded-full font-medium transition-all duration-200 ${
							unit === "kg"
								? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
								: "bg-transparent text-zinc-500"
						}`}
					>
						kg
					</button>
				</div>
				{lifts.map(({ label, delay }, i) => (
					<div
						key={label}
						className="glass-card p-5 animate-fade-in"
						style={{ animationDelay: `${delay}ms` }}
					>
						<label className="block">
							<span className="block text-sm font-[family-name:var(--font-heading)] uppercase tracking-wide text-zinc-400 mb-2">
								{label} ({unit})
							</span>
							<input
								type="number"
								min="0"
								step="any"
								value={liftState[i].value}
								onChange={(e) => liftState[i].setter(e.target.value)}
								placeholder="—"
								className="w-full px-4 py-4 text-2xl font-[family-name:var(--font-mono)] bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
							/>
						</label>
					</div>
				))}
				{error && <p className="text-red-400 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={isPending}
					className="w-full min-h-16 text-xl rounded-2xl btn-gradient-cyan disabled:opacity-50"
				>
					{isPending ? "Starting..." : "Start Program"}
				</button>
			</form>
		</div>
	);
}
