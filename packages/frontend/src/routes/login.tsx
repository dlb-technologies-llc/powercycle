import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLogin } from "../lib/queries";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const login = useLogin();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			await login.mutateAsync({ username, password });
			navigate({ to: "/" });
		} catch {
			setError("Invalid username or password");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh]">
			<h1 className="text-3xl font-bold mb-8">PowerCycle</h1>
			<form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
				<div>
					<label
						htmlFor="username"
						className="block text-sm text-zinc-400 mb-1"
					>
						Username
					</label>
					<input
						id="username"
						type="text"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
						autoComplete="username"
						required
					/>
				</div>
				<div>
					<label
						htmlFor="password"
						className="block text-sm text-zinc-400 mb-1"
					>
						Password
					</label>
					<input
						id="password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
						autoComplete="current-password"
						required
					/>
				</div>
				{error && <p className="text-red-400 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={login.isPending}
					className="w-full py-3 bg-zinc-100 text-zinc-900 font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
				>
					{login.isPending ? "Logging in..." : "Log In"}
				</button>
			</form>
		</div>
	);
}
