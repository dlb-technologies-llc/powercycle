import { describe, expect, it } from "vitest";
import {
	generateMainLiftSets,
	generateWorkoutPlan,
} from "../src/engine/workout.js";
import type { UserLifts } from "../src/schema/lifts.js";

const TEST_LIFTS: UserLifts = {
	squat: 315,
	bench: 235,
	deadlift: 405,
	ohp: 150,
	unit: "lbs",
};

describe("generateMainLiftSets", () => {
	it("generates Round 1 squat sets with correct weights", () => {
		// Round 1: [45%x10, 55%x5, 65%x5, 75%x5, 85%x5+, 85%x5+]
		const sets = generateMainLiftSets(315, 1, "lbs");
		expect(sets).toHaveLength(6);

		// Verify weights: 315 * percentage, rounded to nearest 5
		expect(sets[0]).toMatchObject({
			setNumber: 1,
			weight: 140,
			reps: 10,
			isAmrap: false,
		}); // 141.75→140
		expect(sets[1]).toMatchObject({
			setNumber: 2,
			weight: 175,
			reps: 5,
			isAmrap: false,
		}); // 173.25→175
		expect(sets[2]).toMatchObject({
			setNumber: 3,
			weight: 205,
			reps: 5,
			isAmrap: false,
		}); // 204.75→205
		expect(sets[3]).toMatchObject({
			setNumber: 4,
			weight: 235,
			reps: 5,
			isAmrap: false,
		}); // 236.25→235
		expect(sets[4]).toMatchObject({
			setNumber: 5,
			weight: 270,
			reps: 5,
			isAmrap: true,
		}); // 267.75→270
		expect(sets[5]).toMatchObject({
			setNumber: 6,
			weight: 270,
			reps: 5,
			isAmrap: true,
		}); // 267.75→270
	});

	it("generates Round 2 squat sets (strength phase)", () => {
		// Round 2: [50%x8, 60%x3, 70%x3, 80%x3, 90%x3+, 90%x3+]
		const sets = generateMainLiftSets(315, 2, "lbs");
		expect(sets).toHaveLength(6);
		expect(sets[0]).toMatchObject({ weight: 160, reps: 8, isAmrap: false }); // 157.5→160
		expect(sets[4]).toMatchObject({ weight: 285, reps: 3, isAmrap: true }); // 283.5→285
		expect(sets[5]).toMatchObject({ weight: 285, reps: 3, isAmrap: true }); // 283.5→285
	});

	it("generates Round 3 bench sets (test phase)", () => {
		// Round 3: [50%x10, 70%x5, 80%x3, 85%x2, 90%x1, 95%x1+]
		const sets = generateMainLiftSets(235, 3, "lbs");
		expect(sets).toHaveLength(6);
		expect(sets[0]).toMatchObject({
			weight: 120,
			reps: 10,
			isAmrap: false,
		}); // 117.5→120
		expect(sets[5]).toMatchObject({ reps: 1, isAmrap: true }); // Only last set is AMRAP
		// Only the last set should be AMRAP in round 3
		expect(sets.filter((s) => s.isAmrap)).toHaveLength(1);
	});

	it("generates Round 4 deload sets (no AMRAP, max 70%)", () => {
		// Round 4: [50%x10, 60%x8, 70%x5, 70%x5, 70%x5, 70%x5]
		const sets = generateMainLiftSets(315, 4, "lbs");
		expect(sets).toHaveLength(6);
		expect(sets.every((s) => !s.isAmrap)).toBe(true);
		// Max percentage is 70%
		expect(Math.max(...sets.map((s) => s.percentage))).toBe(0.7);
	});
});

describe("generateWorkoutPlan", () => {
	it("generates squat day (day 1) workout", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 1);
		expect(plan.mainLift).toBe("squat");
		expect(plan.day).toBe(1);
		expect(plan.round).toBe(1);
		expect(plan.cycle).toBe(1);
		expect(plan.mainLiftSets).toHaveLength(6);
		expect(plan.variation).toBeDefined();
		expect(plan.variation.category).toBe("squat_variation");
		expect(plan.accessories.length).toBeGreaterThan(0);
	});

	it("generates bench day (day 2) workout", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 2);
		expect(plan.mainLift).toBe("bench");
		expect(plan.variation.category).toBe("bench_variation");
	});

	it("generates deadlift day (day 3) workout", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 3);
		expect(plan.mainLift).toBe("deadlift");
		expect(plan.variation.category).toBe("deadlift_variation");
	});

	it("generates OHP day (day 4) workout with delt as variation", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 4);
		expect(plan.mainLift).toBe("ohp");
		// Day 4 has no formal variation — first delt exercise serves as variation
		expect(plan.variation.category).toBe("delt");
		// Remaining accessories: 2 more delts + bicep + tricep = 4
		expect(plan.accessories).toHaveLength(4);
		const accCategories = plan.accessories.map((a) => a.category);
		expect(accCategories).toContain("delt");
		expect(accCategories).toContain("bicep");
		expect(accCategories).toContain("tricep");
	});

	it("variation has 6 RPE sets", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 1);
		expect(plan.variation.sets).toHaveLength(6);
		// Each set should have RPE range and rep range
		for (const set of plan.variation.sets) {
			expect(set.rpeMin).toBeDefined();
			expect(set.rpeMax).toBeDefined();
			expect(set.repMin).toBeDefined();
			expect(set.repMax).toBeDefined();
		}
	});

	it("accessories have correct categories for leg day", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 1);
		const categories = plan.accessories.map(
			(a: { category: string }) => a.category,
		);
		expect(categories).toContain("compound_leg");
		expect(categories).toContain("quad");
		expect(categories).toContain("hamstring_glute");
		expect(categories).toContain("calf");
	});

	it("accessories have correct categories for push day", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 2);
		const categories = plan.accessories.map(
			(a: { category: string }) => a.category,
		);
		expect(categories).toContain("chest");
		expect(categories).toContain("tricep");
	});

	it("generates workout plan with kg unit (2.5 kg increment)", () => {
		const kgLifts: UserLifts = {
			squat: 140,
			bench: 100,
			deadlift: 180,
			ohp: 60,
			unit: "kg",
		};
		const plan = generateWorkoutPlan(kgLifts, 1, 1, 1);
		expect(plan.mainLift).toBe("squat");
		// 140 * 0.85 = 119 → rounds to 120 (nearest 2.5)
		const topSet = plan.mainLiftSets[4];
		expect(topSet.weight).toBe(120);
		// 140 * 0.45 = 63 → rounds to 62.5 (nearest 2.5)
		expect(plan.mainLiftSets[0].weight).toBe(62.5);
	});

	it("accessories have correct categories for pull day", () => {
		const plan = generateWorkoutPlan(TEST_LIFTS, 1, 1, 3);
		const categories = plan.accessories.map(
			(a: { category: string }) => a.category,
		);
		expect(categories).toContain("vertical_pull");
		expect(categories).toContain("lateral_pull");
		expect(categories).toContain("bicep");
	});
});

describe("generateWorkoutPlan with null 1RM", () => {
	it("returns empty mainLiftSets when day's main lift 1RM is null", () => {
		const liftsWithNullSquat: UserLifts = {
			squat: null,
			bench: 235,
			deadlift: 405,
			ohp: 150,
			unit: "lbs",
		};
		const plan = generateWorkoutPlan(liftsWithNullSquat, 1, 1, 1); // day 1 = squat
		expect(plan.mainLift).toBe("squat");
		expect(plan.mainLiftSets).toHaveLength(0);
		// Variation and accessories should still be generated
		expect(plan.variation).toBeDefined();
		expect(plan.accessories.length).toBeGreaterThan(0);
	});

	it("generates main lift sets normally when another lift is null", () => {
		const liftsWithNullBench: UserLifts = {
			squat: 315,
			bench: null,
			deadlift: 405,
			ohp: 150,
			unit: "lbs",
		};
		// Day 1 = squat, bench being null shouldn't matter
		const plan = generateWorkoutPlan(liftsWithNullBench, 1, 1, 1);
		expect(plan.mainLiftSets).toHaveLength(6);
	});

	it("handles all null 1RMs", () => {
		const allNull: UserLifts = {
			squat: null,
			bench: null,
			deadlift: null,
			ohp: null,
			unit: "lbs",
		};
		const plan = generateWorkoutPlan(allNull, 1, 1, 1);
		expect(plan.mainLiftSets).toHaveLength(0);
		expect(plan.variation).toBeDefined();
	});
});
