import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { RpeNumber } from "../src/schema/api.js";

const NullableRpe = Schema.NullOr(RpeNumber);

describe("RpeNumber schema", () => {
	it("rejects RPE below minimum (0)", () => {
		expect(() => Schema.decodeUnknownSync(RpeNumber)(0)).toThrow();
	});

	it("rejects RPE above maximum (11)", () => {
		expect(() => Schema.decodeUnknownSync(RpeNumber)(11)).toThrow();
	});

	it("rejects negative RPE (-1)", () => {
		expect(() => Schema.decodeUnknownSync(RpeNumber)(-1)).toThrow();
	});

	it("accepts RPE at minimum boundary (1)", () => {
		expect(Schema.decodeUnknownSync(RpeNumber)(1)).toBe(1);
	});

	it("accepts RPE at midpoint (5)", () => {
		expect(Schema.decodeUnknownSync(RpeNumber)(5)).toBe(5);
	});

	it("accepts RPE at maximum boundary (10)", () => {
		expect(Schema.decodeUnknownSync(RpeNumber)(10)).toBe(10);
	});
});

describe("NullOr(RpeNumber) schema", () => {
	it("accepts null", () => {
		expect(Schema.decodeUnknownSync(NullableRpe)(null)).toBeNull();
	});

	it("accepts valid RPE through nullable wrapper", () => {
		expect(Schema.decodeUnknownSync(NullableRpe)(5)).toBe(5);
	});

	it("rejects invalid RPE through nullable wrapper", () => {
		expect(() => Schema.decodeUnknownSync(NullableRpe)(11)).toThrow();
	});
});
