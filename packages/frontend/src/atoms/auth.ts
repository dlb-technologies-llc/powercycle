import { ApiClient } from "./client";

const TOKEN_KEY = "powercycle_token";

export const getToken = (): string | null =>
	typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

export const setToken = (token: string): void =>
	localStorage.setItem(TOKEN_KEY, token);

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

/**
 * Login mutation atom.
 * Consumer should call `setToken(result.token)` after successful login.
 */
export const loginAtom = ApiClient.mutation("auth", "login");

/**
 * Logout mutation atom.
 * Consumer should call `clearToken()` after successful logout.
 */
export const logoutAtom = ApiClient.mutation("auth", "logout");
