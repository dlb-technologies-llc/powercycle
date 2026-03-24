import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
	component: () => (
		<div className="min-h-screen bg-zinc-950 text-zinc-100">
			<header className="border-b border-zinc-800 px-6 py-4">
				<div className="flex items-center justify-between max-w-2xl mx-auto">
					<Link to="/" className="text-xl font-bold">
						PowerCycle
					</Link>
					<nav className="flex gap-4">
						<Link
							to="/history"
							className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
						>
							History
						</Link>
					</nav>
				</div>
			</header>
			<main className="max-w-2xl mx-auto px-6 py-8">
				<Outlet />
			</main>
		</div>
	),
});
