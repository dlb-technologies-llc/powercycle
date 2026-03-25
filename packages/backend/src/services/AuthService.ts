import { Effect, Layer, ServiceMap } from "effect";

const COOKIE_NAME = "powercycle_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const sign = async (payload: string, secret: string): Promise<string> => {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(payload),
	);
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

const timingSafeEqual = (a: string, b: string): boolean => {
	if (a.length !== b.length) return false;
	const encoder = new TextEncoder();
	const bufA = encoder.encode(a);
	const bufB = encoder.encode(b);
	let result = 0;
	for (let i = 0; i < bufA.length; i++) {
		result |= bufA[i] ^ bufB[i];
	}
	return result === 0;
};

const verify = async (
	payload: string,
	signature: string,
	secret: string,
): Promise<boolean> => {
	const expected = await sign(payload, secret);
	return timingSafeEqual(expected, signature);
};

export class AuthService extends ServiceMap.Service<
	AuthService,
	{
		readonly createSession: (userId: string) => Effect.Effect<string>;
		readonly verifySession: (token: string) => Effect.Effect<string, Error>;
		readonly createSessionCookie: (token: string) => Effect.Effect<string>;
		readonly createLogoutCookie: () => Effect.Effect<string>;
	}
>()("AuthService") {
	static make(secret: string) {
		return {
			createSession: (userId: string) =>
				Effect.gen(function* () {
					const timestamp = Date.now().toString();
					const payload = `${userId}.${timestamp}`;
					const sig = yield* Effect.promise(() => sign(payload, secret));
					return `${payload}.${sig}`;
				}),

			verifySession: (token: string) =>
				Effect.gen(function* () {
					const parts = token.split(".");
					if (parts.length !== 3) {
						return yield* Effect.fail(new Error("Invalid session token"));
					}
					const [userId, timestamp, sig] = parts;
					const payload = `${userId}.${timestamp}`;
					const valid = yield* Effect.promise(() =>
						verify(payload, sig, secret),
					);
					if (!valid) {
						return yield* Effect.fail(new Error("Invalid session signature"));
					}
					const age = (Date.now() - Number(timestamp)) / 1000;
					if (age > MAX_AGE) {
						return yield* Effect.fail(new Error("Session expired"));
					}
					return userId;
				}),

			createSessionCookie: (token: string) =>
				Effect.succeed(
					`${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`,
				),

			createLogoutCookie: () =>
				Effect.succeed(
					`${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
				),
		};
	}

	static layer(secret: string) {
		return Layer.succeed(AuthService)(AuthService.make(secret));
	}

	static test = Layer.succeed(AuthService)(
		AuthService.make("test-secret-key-for-testing-only"),
	);
}
