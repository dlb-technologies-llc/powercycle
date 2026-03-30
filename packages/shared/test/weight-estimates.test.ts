import { describe, expect, it } from "vitest";
import {
	CATEGORY_LIFT_MAP,
	estimateWeight,
} from "../src/engine/weight-estimates.js";
import type { UserLifts } from "../src/schema/lifts.js";
import { ExerciseCategory } from "../src/schema/workout.js";

const lbsLifts: UserLifts = {
	squat: 315,
	bench: 235,
	deadlift: 405,
	ohp: 150,
	unit: "lbs",
};

describe("estimateWeight", () => {
	describe("all 13 categories with lbs values", () => {
		it("squat_variation → squat @ 60% = 190 lbs", () => {
			// 315 * 0.60 = 189 → rounds to 190
			expect(estimateWeight("squat_variation", lbsLifts)).toBe(190);
		});

		it("bench_variation → bench @ 60% = 140 lbs", () => {
			// 235 * 0.60 = 141 → rounds to 140
			expect(estimateWeight("bench_variation", lbsLifts)).toBe(140);
		});

		it("deadlift_variation → deadlift @ 55% = 225 lbs", () => {
			// 405 * 0.55 = 222.75 → rounds to 225
			expect(estimateWeight("deadlift_variation", lbsLifts)).toBe(225);
		});

		it("compound_leg → squat @ 45% = 140 lbs", () => {
			// 315 * 0.45 = 141.75 → rounds to 140
			expect(estimateWeight("compound_leg", lbsLifts)).toBe(140);
		});

		it("chest → bench @ 45% = 105 lbs", () => {
			// 235 * 0.45 = 105.75 → rounds to 105
			expect(estimateWeight("chest", lbsLifts)).toBe(105);
		});

		it("vertical_pull → deadlift @ 30% = 120 lbs", () => {
			// 405 * 0.30 = 121.5 → rounds to 120
			expect(estimateWeight("vertical_pull", lbsLifts)).toBe(120);
		});

		it("lateral_pull → deadlift @ 35% = 140 lbs", () => {
			// 405 * 0.35 = 141.75 → rounds to 140
			expect(estimateWeight("lateral_pull", lbsLifts)).toBe(140);
		});

		it("quad → squat @ 25% = 80 lbs", () => {
			// 315 * 0.25 = 78.75 → rounds to 80
			expect(estimateWeight("quad", lbsLifts)).toBe(80);
		});

		it("hamstring_glute → squat @ 25% = 80 lbs", () => {
			// 315 * 0.25 = 78.75 → rounds to 80
			expect(estimateWeight("hamstring_glute", lbsLifts)).toBe(80);
		});

		it("calf → squat @ 30% = 95 lbs", () => {
			// 315 * 0.30 = 94.5 → rounds to 95
			expect(estimateWeight("calf", lbsLifts)).toBe(95);
		});

		it("tricep → bench @ 25% = 60 lbs", () => {
			// 235 * 0.25 = 58.75 → rounds to 60
			expect(estimateWeight("tricep", lbsLifts)).toBe(60);
		});

		it("bicep → bench @ 20% = 45 lbs", () => {
			// 235 * 0.20 = 47 → rounds to 45
			expect(estimateWeight("bicep", lbsLifts)).toBe(45);
		});

		it("delt → ohp @ 35% = 55 lbs", () => {
			// 150 * 0.35 = 52.5 → rounds to 55
			expect(estimateWeight("delt", lbsLifts)).toBe(55);
		});
	});

	describe("null 1RM returns null", () => {
		const nullSquatLifts: UserLifts = {
			squat: null,
			bench: 235,
			deadlift: 405,
			ohp: 150,
			unit: "lbs",
		};

		it("squat_variation returns null when squat is null", () => {
			expect(estimateWeight("squat_variation", nullSquatLifts)).toBeNull();
		});

		it("compound_leg returns null when squat is null", () => {
			expect(estimateWeight("compound_leg", nullSquatLifts)).toBeNull();
		});

		it("quad returns null when squat is null", () => {
			expect(estimateWeight("quad", nullSquatLifts)).toBeNull();
		});

		it("hamstring_glute returns null when squat is null", () => {
			expect(estimateWeight("hamstring_glute", nullSquatLifts)).toBeNull();
		});

		it("calf returns null when squat is null", () => {
			expect(estimateWeight("calf", nullSquatLifts)).toBeNull();
		});

		it("bench_variation still works when only squat is null", () => {
			// 235 * 0.60 = 141 → rounds to 140
			expect(estimateWeight("bench_variation", nullSquatLifts)).toBe(140);
		});

		it("deadlift_variation still works when only squat is null", () => {
			// 405 * 0.55 = 222.75 → rounds to 225
			expect(estimateWeight("deadlift_variation", nullSquatLifts)).toBe(225);
		});

		it("delt still works when only squat is null", () => {
			// 150 * 0.35 = 52.5 → rounds to 55
			expect(estimateWeight("delt", nullSquatLifts)).toBe(55);
		});
	});

	describe("kg unit uses 2.5 kg rounding", () => {
		const kgLifts: UserLifts = {
			squat: 140,
			bench: 100,
			deadlift: 180,
			ohp: 65,
			unit: "kg",
		};

		it("squat_variation → squat @ 60% = 85 kg", () => {
			// 140 * 0.60 = 84 → rounds to nearest 2.5 = 85
			expect(estimateWeight("squat_variation", kgLifts)).toBe(85);
		});

		it("deadlift_variation → deadlift @ 55% = 100 kg", () => {
			// 180 * 0.55 = 99 → rounds to nearest 2.5 = 100
			expect(estimateWeight("deadlift_variation", kgLifts)).toBe(100);
		});

		it("delt → ohp @ 35% = 22.5 kg", () => {
			// 65 * 0.35 = 22.75 → rounds to nearest 2.5 = 22.5
			expect(estimateWeight("delt", kgLifts)).toBe(22.5);
		});
	});
});

describe("CATEGORY_LIFT_MAP exhaustiveness", () => {
	it("has an entry for every ExerciseCategory value", () => {
		const categories = ExerciseCategory.literals;
		for (const category of categories) {
			expect(CATEGORY_LIFT_MAP).toHaveProperty(category);
		}
	});

	it("covers exactly 13 categories", () => {
		expect(Object.keys(CATEGORY_LIFT_MAP)).toHaveLength(13);
	});
});
