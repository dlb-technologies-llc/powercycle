import { clearToken, getToken, setToken } from "../lib/api";
import { ApiClient } from "./client";

export { clearToken, getToken, setToken };

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
