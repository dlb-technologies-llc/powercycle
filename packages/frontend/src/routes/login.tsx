import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
	component: () => (
		<div>
			<h1 className="text-2xl font-bold">Login</h1>
			<p className="text-zinc-400 mt-2">Login form coming...</p>
		</div>
	),
});
