import { describe, expect, it } from "vitest";
import {
	calculateCycleProgression,
	calculateProgression,
} from "../src/engine/progression.js";

describe("calculateProgression", () => {
	it("calculates new 1RM from Epley: 299.25 @ 2 reps with current 315 → 320", () => {
		// Squat: 95% of 315 = 299.25, got 2 reps → Epley = 319.2 → 320
		const result = calculateProgression(299.25, 2, 315);
		expect(result.newMax).toBe(320);
		expect(result.progressed).toBe(true);
	});

	it("calculates bench: 223.25 @ 3 reps → 245", () => {
		const result = calculateProgression(223.25, 3, 235);
		expect(result.newMax).toBe(245);
		expect(result.progressed).toBe(true);
	});

	it("calculates deadlift: 384.75 @ 2 reps → 410", () => {
		const result = calculateProgression(384.75, 2, 405);
		expect(result.newMax).toBe(410);
		expect(result.progressed).toBe(true);
	});

	it("no progression for 1 rep (same weight)", () => {
		const result = calculateProgression(142.5, 1, 150);
		expect(result.newMax).toBe(150);
		expect(result.progressed).toBe(false);
	});

	it("no progression for 0 reps", () => {
		const result = calculateProgression(142.5, 0, 150);
		expect(result.newMax).toBe(150);
		expect(result.progressed).toBe(false);
	});

	it("never decreases 1RM", () => {
		// Even if calculated is lower, keep current
		const result = calculateProgression(100, 2, 315);
		expect(result.newMax).toBe(315);
		expect(result.progressed).toBe(false);
	});
});

describe("calculateCycleProgression", () => {
	it("calculates all 4 lifts matching spreadsheet", () => {
		const result = calculateCycleProgression(
			{
				squat: { weight: 299.25, reps: 2 },
				bench: { weight: 223.25, reps: 3 },
				deadlift: { weight: 384.75, reps: 2 },
				ohp: { weight: 142.5, reps: 1 },
			},
			{ squat: 315, bench: 235, deadlift: 405, ohp: 150 },
		);
		expect(result.squat.newMax).toBe(320);
		expect(result.bench.newMax).toBe(245);
		expect(result.deadlift.newMax).toBe(410);
		expect(result.ohp.newMax).toBe(150); // no progression
		expect(result.ohp.progressed).toBe(false);
	});
});
