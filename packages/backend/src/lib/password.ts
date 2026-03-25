import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { InternalError } from "@powercycle/shared/errors/index";
import { Effect } from "effect";

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

const scryptHash = (password: string, salt: Buffer): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
			if (err) reject(err);
			else resolve(derivedKey);
		});
	});

export const hashPassword = (password: string) =>
	Effect.tryPromise({
		try: async () => {
			const salt = randomBytes(SALT_LENGTH);
			const derivedKey = await scryptHash(password, salt);
			return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
		},
		catch: (error) => new InternalError({ message: `Hash failed: ${error}` }),
	});

export const verifyPassword = (password: string, hash: string) =>
	Effect.tryPromise({
		try: async () => {
			const [saltHex, keyHex] = hash.split(":");
			if (!saltHex || !keyHex) return false;
			const salt = Buffer.from(saltHex, "hex");
			const storedKey = Buffer.from(keyHex, "hex");
			const derivedKey = await scryptHash(password, salt);
			return timingSafeEqual(storedKey, derivedKey);
		},
		catch: (error) => new InternalError({ message: `Verify failed: ${error}` }),
	});
