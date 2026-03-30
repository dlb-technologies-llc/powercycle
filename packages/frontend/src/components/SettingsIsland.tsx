import { useAtomValue } from "@effect/atom-react";
import { AsyncResult } from "effect/unstable/reactivity";
import { currentCycleAtom } from "../atoms/cycles";
import WeightManagement from "./WeightManagement";

export default function SettingsIsland() {
	const result = useAtomValue(currentCycleAtom);

	if (AsyncResult.isInitial(result) || result.waiting) {
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	if (AsyncResult.isFailure(result)) {
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<p className="text-muted-foreground">Failed to load settings.</p>
			</div>
		);
	}

	const cycle = result.value;

	if (!cycle) {
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<p className="text-muted-foreground">
					No active cycle. Start a cycle from the dashboard first.
				</p>
			</div>
		);
	}

	return (
		<div>
			<h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
			<WeightManagement cycle={cycle} />
		</div>
	);
}
