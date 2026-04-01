import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCycleAtom, previousMaxesAtom } from "../atoms/cycles";

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

	const previousMaxesResult = useAtomValue(previousMaxesAtom);
	const [prefilled, setPrefilled] = useState(false);

	useEffect(() => {
		if (prefilled) return;
		if (!AsyncResult.isSuccess(previousMaxesResult)) return;
		const data = previousMaxesResult.value;
		if (!data) return; // null = no previous cycles (first-time user)
		setPrefilled(true);
		if (data.squat != null) setSquat(String(data.squat));
		if (data.bench != null) setBench(String(data.bench));
		if (data.deadlift != null) setDeadlift(String(data.deadlift));
		if (data.ohp != null) setOhp(String(data.ohp));
		setUnit(data.unit);
	}, [previousMaxesResult, prefilled]);

	const createCycle = useAtomSet(createCycleAtom, { mode: "promiseExit" });

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
			<h1 className="text-2xl font-bold text-foreground mb-1">
				Set your maxes
			</h1>
			<p className="text-sm text-muted-foreground mb-8">
				Enter any 1RMs you know — you'll be asked for others when needed.
			</p>
			{prefilled && (
				<p className="text-xs text-muted-foreground mb-4">
					Pre-filled from your last cycle. Edit any value to update.
				</p>
			)}
			<form onSubmit={handleSubmit} className="space-y-3">
				<div className="inline-flex rounded-lg border border-border p-1 mb-4">
					<Button
						type="button"
						variant={unit === "lbs" ? "default" : "ghost"}
						size="sm"
						onClick={() => setUnit("lbs")}
						className={cn(
							unit !== "lbs" && "text-muted-foreground hover:text-foreground",
						)}
					>
						lbs
					</Button>
					<Button
						type="button"
						variant={unit === "kg" ? "default" : "ghost"}
						size="sm"
						onClick={() => setUnit("kg")}
						className={cn(
							unit !== "kg" && "text-muted-foreground hover:text-foreground",
						)}
					>
						kg
					</Button>
				</div>
				{lifts.map(({ label }, i) => (
					<Card key={label}>
						<CardContent>
							<Label className="block">
								<span className="mb-1.5 block">
									{label} ({unit})
								</span>
								<Input
									type="number"
									min="0"
									step="any"
									value={liftState[i].value}
									onChange={(e) => liftState[i].setter(e.target.value)}
									placeholder="—"
									className="font-mono"
								/>
							</Label>
						</CardContent>
					</Card>
				))}
				{error && <p className="text-destructive text-sm">{error}</p>}
				<Button type="submit" disabled={isPending} className="w-full">
					{isPending ? "Starting..." : "Start program"}
				</Button>
			</form>
		</div>
	);
}
