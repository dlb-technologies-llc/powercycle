import { describe, expect, it } from "@effect/vitest";
import {
	InternalError,
	InvalidRoundError,
	NotFoundError,
	ValidationError,
} from "../src/errors/index.js";

describe("errors", () => {
	it("NotFoundError has correct tag and fields", () => {
		const err = new NotFoundError({ message: "not found", resource: "user" });
		expect(err._tag).toBe("NotFoundError");
		expect(err.resource).toBe("user");
	});

	it("ValidationError has correct tag and fields", () => {
		const err = new ValidationError({ message: "invalid", field: "email" });
		expect(err._tag).toBe("ValidationError");
		expect(err.field).toBe("email");
	});

	it("ValidationError field is optional", () => {
		const err = new ValidationError({ message: "invalid" });
		expect(err._tag).toBe("ValidationError");
		expect(err.field).toBeUndefined();
	});

	it("InternalError has correct tag", () => {
		const err = new InternalError({ message: "server error" });
		expect(err._tag).toBe("InternalError");
	});

	it("existing domain errors still work", () => {
		const err = new InvalidRoundError({ round: 5 });
		expect(err._tag).toBe("InvalidRoundError");
	});
});
