import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: () => (
		<div>
			<h1 className="text-2xl font-bold">Dashboard</h1>
			<p className="text-zinc-400 mt-2">Loading workout...</p>
		</div>
	),
});
