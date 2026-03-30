import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { useState } from "react";
import { createCycleAtom } from "../atoms/cycles";

const lifts = [
	{ label: "Squat" },
	{ label: "Bench Press" },
	{ label: "Deadlift" },
	{ label: "Overhead Press" },
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
			<h1 className="text-2xl font-semibold text-neutral-100 mb-2">
				Set your maxes
			</h1>
			<p className="text-neutral-400 mb-8">
				Enter any 1RMs you know — you'll be asked for others when needed.
			</p>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="inline-flex bg-neutral-800 rounded-lg p-1 mb-6">
					<button
						type="button"
						onClick={() => setUnit("lbs")}
						className={`px-5 py-2 rounded-lg font-medium transition-colors ${
							unit === "lbs" ? "bg-indigo-500 text-white" : "text-neutral-400"
						}`}
					>
						lbs
					</button>
					<button
						type="button"
						onClick={() => setUnit("kg")}
						className={`px-5 py-2 rounded-lg font-medium transition-colors ${
							unit === "kg" ? "bg-indigo-500 text-white" : "text-neutral-400"
						}`}
					>
						kg
					</button>
				</div>
				{lifts.map(({ label }, i) => (
					<div
						key={label}
						className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
					>
						<label className="block">
							<span className="block text-sm font-medium text-neutral-400 mb-2">
								{label} ({unit})
							</span>
							<input
								type="number"
								min="0"
								step="any"
								value={liftState[i].value}
								onChange={(e) => liftState[i].setter(e.target.value)}
								placeholder="—"
								className="w-full px-4 py-3 text-lg font-mono bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							/>
						</label>
					</div>
				))}
				{error && <p className="text-red-400 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={isPending}
					className="w-full py-3 text-lg bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
				>
					{isPending ? "Starting..." : "Start program"}
				</button>
			</form>
		</div>
	);
}
