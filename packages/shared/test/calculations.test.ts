import { describe, expect, it } from "vitest";
import {
	calculate1RM,
	calculateWeight,
	roundToNearest,
} from "../src/engine/calculations.js";

describe("roundToNearest", () => {
	it("rounds down to nearest 5 lbs", () => {
		// 141.75 → 140 (rounds down)
		expect(roundToNearest(141.75)).toBe(140);
	});

	it("rounds up to nearest 5 lbs", () => {
		// 267.75 → 270 (rounds up)
		expect(roundToNearest(267.75)).toBe(270);
	});

	it("keeps exact multiples unchanged", () => {
		expect(roundToNearest(225)).toBe(225);
		expect(roundToNearest(315)).toBe(315);
	});

	it("rounds to nearest 2.5 for kg", () => {
		expect(roundToNearest(67.3, 2.5)).toBe(67.5);
		expect(roundToNearest(68.8, 2.5)).toBe(70);
		expect(roundToNearest(66.1, 2.5)).toBe(65);
	});

	it("handles zero", () => {
		expect(roundToNearest(0)).toBe(0);
	});
});

describe("calculateWeight", () => {
	it("calculates 315 squat at 85% = 270 lbs", () => {
		// Spreadsheet: 315 * 0.85 = 267.75 → rounds to 270
		expect(calculateWeight(315, 0.85, "lbs")).toBe(270);
	});

	it("calculates 235 bench at 45% = 105 lbs", () => {
		// Spreadsheet: 235 * 0.45 = 105.75 → rounds to 105
		expect(calculateWeight(235, 0.45, "lbs")).toBe(105);
	});

	it("calculates 405 deadlift at 70% = 285 lbs", () => {
		// Spreadsheet: 405 * 0.70 = 283.5 → rounds to 285
		expect(calculateWeight(405, 0.7, "lbs")).toBe(285);
	});

	it("calculates 150 OHP at 95% = 145 lbs", () => {
		// Spreadsheet: 150 * 0.95 = 142.5 → rounds to 145
		expect(calculateWeight(150, 0.95, "lbs")).toBe(145);
	});

	it("calculates 315 squat at 45% = 140 lbs", () => {
		// Spreadsheet: 315 * 0.45 = 141.75 → rounds to 140
		expect(calculateWeight(315, 0.45, "lbs")).toBe(140);
	});

	it("uses 2.5 kg increment for kg unit", () => {
		expect(calculateWeight(140, 0.85, "kg")).toBe(
			roundToNearest(140 * 0.85, 2.5),
		);
	});
});

describe("calculate1RM", () => {
	it("calculates Epley 1RM: 299.25 @ 2 reps → 320", () => {
		// Spreadsheet: Squat 2 reps @ 95% of 315 (= 299.25) → new 1RM 320
		// Epley: 299.25 * (1 + 2/30) = 299.25 * 1.0667 = 319.2 → 320
		expect(calculate1RM(299.25, 2)).toBe(320);
	});

	it("calculates Epley 1RM: 223.25 @ 3 reps → 245", () => {
		// Spreadsheet: Bench 3 reps @ 95% of 235 (= 223.25) → new 1RM 245
		// Epley: 223.25 * (1 + 3/30) = 223.25 * 1.1 = 245.575 → 245
		expect(calculate1RM(223.25, 3)).toBe(245);
	});

	it("calculates Epley 1RM: 384.75 @ 2 reps → 410", () => {
		// Spreadsheet: Deadlift 2 reps @ 95% of 405 (= 384.75) → new 1RM 410
		// Epley: 384.75 * (1 + 2/30) = 384.75 * 1.0667 = 410.4 → 410
		expect(calculate1RM(384.75, 2)).toBe(410);
	});

	it("returns rounded weight for 1 rep (no Epley)", () => {
		// 1 rep = the weight itself (Epley doesn't apply)
		expect(calculate1RM(142.5, 1)).toBe(145);
	});

	it("returns rounded weight for 0 reps", () => {
		expect(calculate1RM(300, 0)).toBe(300);
	});
});
