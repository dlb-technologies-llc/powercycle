import { NotFoundError } from "@powercycle/shared/errors/index";
import { Effect, Layer, ServiceMap } from "effect";
import type { User } from "../db/schema.js";

export class UserService extends ServiceMap.Service<
	UserService,
	{
		readonly createEntity: (input: {
			username: string;
			passwordHash: string;
		}) => Effect.Effect<{
			id: string;
			username: string;
			passwordHash: string;
			createdAt: Date;
		}>;
		readonly validateUser: (
			user: User | undefined,
			userId: string,
		) => Effect.Effect<User, NotFoundError>;
	}
>()("@powercycle/UserService") {}

export const UserLive = Layer.succeed(UserService)({
	createEntity: (input) =>
		Effect.sync(() => ({
			id: crypto.randomUUID(),
			username: input.username,
			passwordHash: input.passwordHash,
			createdAt: new Date(),
		})),
	validateUser: (user, userId) =>
		user
			? Effect.succeed(user)
			: Effect.fail(
					new NotFoundError({
						message: `User not found: ${userId}`,
						resource: "user",
					}),
				),
});

// Pure service — same impl for test
export const UserTest = UserLive;
