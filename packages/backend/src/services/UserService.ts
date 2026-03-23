import { Effect, Layer, ServiceMap } from "effect";

export class UserService extends ServiceMap.Service<
	UserService,
	{
		readonly createUser: (
			username: string,
			password: string,
		) => Effect.Effect<{ id: string; username: string }>;
		readonly verifyUser: (
			username: string,
			password: string,
		) => Effect.Effect<{ id: string; username: string }>;
	}
>()("UserService") {
	static test = Layer.succeed(this, {
		createUser: (username, _password) =>
			Effect.sync(() => ({ id: crypto.randomUUID(), username })),
		verifyUser: (username, _password) =>
			Effect.succeed({ id: "test-user-id", username }),
	});
}
