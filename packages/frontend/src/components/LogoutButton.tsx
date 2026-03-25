import { useAtomSet } from "@effect/atom-react";
import { Exit } from "effect";
import { useEffect, useState } from "react";
import { clearToken, getToken, logoutAtom } from "../atoms/auth";

export default function LogoutButton() {
	const logout = useAtomSet(logoutAtom, { mode: "promiseExit" });
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		setIsLoggedIn(!!getToken());
	}, []);

	if (!isLoggedIn) return null;

	const handleLogout = async () => {
		const result = await logout({});
		Exit.match(result, {
			onSuccess: () => {
				clearToken();
				window.location.href = "/login";
			},
			onFailure: () => {
				// Even on failure, clear local state and redirect
				clearToken();
				window.location.href = "/login";
			},
		});
	};

	return (
		<button
			type="button"
			onClick={handleLogout}
			className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
		>
			Logout
		</button>
	);
}
