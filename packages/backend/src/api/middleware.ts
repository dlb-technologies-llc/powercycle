import { Effect } from "effect";
import type { AuthService } from "../services/AuthService.js";

type AuthServiceShape = {
	readonly verifySession: (token: string) => Effect.Effect<string, Error>;
};

export const getUserId = (
	authHeader: string | undefined,
	authService: AuthServiceShape,
) =>
	Effect.gen(function* () {
		if (!authHeader?.startsWith("Bearer ")) {
			return yield* Effect.die(
				new Error("Missing or invalid Authorization header"),
			);
		}
		const token = authHeader.slice(7);
		return yield* authService.verifySession(token).pipe(Effect.orDie);
	});
