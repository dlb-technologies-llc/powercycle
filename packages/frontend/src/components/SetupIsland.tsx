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
			<h1 className="text-2xl font-bold text-black mb-1">Set your maxes</h1>
			<p className="text-sm text-gray-600 mb-8">
				Enter any 1RMs you know — you'll be asked for others when needed.
			</p>
			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="inline-flex rounded-lg border border-gray-200 p-1 mb-4">
					<button
						type="button"
						onClick={() => setUnit("lbs")}
						className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
							unit === "lbs"
								? "bg-black text-white"
								: "text-gray-400 hover:text-gray-600"
						}`}
					>
						lbs
					</button>
					<button
						type="button"
						onClick={() => setUnit("kg")}
						className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-colors ${
							unit === "kg"
								? "bg-black text-white"
								: "text-gray-400 hover:text-gray-600"
						}`}
					>
						kg
					</button>
				</div>
				{lifts.map(({ label }, i) => (
					<div key={label} className="card">
						<label className="block">
							<span className="label">
								{label} ({unit})
							</span>
							<input
								type="number"
								min="0"
								step="any"
								value={liftState[i].value}
								onChange={(e) => liftState[i].setter(e.target.value)}
								placeholder="—"
								className="input w-full font-mono"
							/>
						</label>
					</div>
				))}
				{error && <p className="text-red-600 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={isPending}
					className="btn-primary w-full"
				>
					{isPending ? "Starting..." : "Start program"}
				</button>
			</form>
		</div>
	);
}
