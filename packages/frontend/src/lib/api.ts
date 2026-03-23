const API_BASE = ""; // Vite proxy handles /api → backend

export const getToken = (): string | null =>
	localStorage.getItem("powercycle_token");

export const setToken = (token: string): void =>
	localStorage.setItem("powercycle_token", token);

export const clearToken = (): void =>
	localStorage.removeItem("powercycle_token");

export const apiFetch = async <T>(
	path: string,
	options: RequestInit = {},
): Promise<T> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...((options.headers as Record<string, string>) ?? {}),
	};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers,
	});
	if (!res.ok) {
		throw new Error(`API error: ${res.status} ${res.statusText}`);
	}
	return res.json();
};
