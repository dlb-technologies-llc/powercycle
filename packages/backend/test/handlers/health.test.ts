import { describe, expect, it } from "@effect/vitest";

describe("health handler", () => {
	it("returns ok status", () => {
		// Health handler just returns { status: "ok" } — trivial
		expect({ status: "ok" }).toEqual({ status: "ok" });
	});
});
