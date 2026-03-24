const TOKEN_KEY = "powercycle_token";

export const getToken = (): string | null =>
	typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token: string): void =>
	localStorage.setItem(TOKEN_KEY, token);

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

/**
 * Fetch wrapper that adds auth token and handles JSON.
 */
export async function apiFetch<T>(
	path: string,
	options?: RequestInit,
): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
	const res = await fetch(path, { ...options, headers });
	if (!res.ok) {
		throw new Error(`API error: ${res.status}`);
	}
	return res.json() as Promise<T>;
}
