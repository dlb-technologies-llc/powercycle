import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateCycle } from "../lib/queries";

export const Route = createFileRoute("/setup")({
	component: SetupPage,
});

function SetupPage() {
	const [squat, setSquat] = useState("");
	const [bench, setBench] = useState("");
	const [deadlift, setDeadlift] = useState("");
	const [ohp, setOhp] = useState("");
	const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
	const [error, setError] = useState("");
	const createCycle = useCreateCycle();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const lifts = {
			squat: Number(squat),
			bench: Number(bench),
			deadlift: Number(deadlift),
			ohp: Number(ohp),
			unit,
		};
		if (Object.values(lifts).some((v) => typeof v === "number" && v <= 0)) {
			setError("All weights must be greater than 0");
			return;
		}
		try {
			await createCycle.mutateAsync(lifts);
			navigate({ to: "/" });
		} catch {
			setError("Failed to create cycle");
		}
	};

	const inputClass =
		"w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 text-lg focus:outline-none focus:border-zinc-500";

	return (
		<div>
			<h1 className="text-2xl font-bold mb-2">Set Your Maxes</h1>
			<p className="text-zinc-400 mb-8">
				Enter your current 1 Rep Max for each lift to start your program.
			</p>
			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="flex gap-2 mb-6">
					<button
						type="button"
						onClick={() => setUnit("lbs")}
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${
							unit === "lbs"
								? "bg-zinc-100 text-zinc-900"
								: "bg-zinc-800 text-zinc-400"
						}`}
					>
						lbs
					</button>
					<button
						type="button"
						onClick={() => setUnit("kg")}
						className={`px-4 py-2 rounded-lg font-medium transition-colors ${
							unit === "kg"
								? "bg-zinc-100 text-zinc-900"
								: "bg-zinc-800 text-zinc-400"
						}`}
					>
						kg
					</button>
				</div>
				{[
					{ label: "Squat", value: squat, setter: setSquat },
					{ label: "Bench Press", value: bench, setter: setBench },
					{ label: "Deadlift", value: deadlift, setter: setDeadlift },
					{ label: "Overhead Press", value: ohp, setter: setOhp },
				].map(({ label, value, setter }) => (
					<div key={label}>
						<label className="block text-sm text-zinc-400 mb-1">
							{label} ({unit})
							<input
								type="number"
								min="0"
								step="5"
								value={value}
								onChange={(e) => setter(e.target.value)}
								placeholder="0"
								className={inputClass}
								required
							/>
						</label>
					</div>
				))}
				{error && <p className="text-red-400 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={createCycle.isPending}
					className="w-full py-4 bg-zinc-100 text-zinc-900 font-bold text-lg rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
				>
					{createCycle.isPending ? "Starting..." : "Start Program"}
				</button>
			</form>
		</div>
	);
}
