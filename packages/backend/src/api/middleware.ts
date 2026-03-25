import { AuthError } from "@powercycle/shared/errors/index";
import { Effect } from "effect";

type AuthServiceShape = {
	readonly verifySession: (token: string) => Effect.Effect<string, AuthError>;
};

export const getUserId = (
	authorization: string | undefined,
	authService: AuthServiceShape,
) =>
	Effect.gen(function* () {
		if (!authorization?.startsWith("Bearer ")) {
			return yield* Effect.fail(
				new AuthError({ message: "Missing authorization header" }),
			);
		}
		const token = authorization.slice(7);
		return yield* authService.verifySession(token);
	});
