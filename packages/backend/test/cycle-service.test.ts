import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { CycleService } from "../src/services/CycleService.js";

describe("CycleService", () => {
	it.effect("creates a cycle with 1RM values", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createCycle("user-1", {
				squat: 315,
				bench: 235,
				deadlift: 405,
				ohp: 150,
				unit: "lbs",
			});
			expect(cycle.squat1rm).toBe(315);
			expect(cycle.currentRound).toBe(1);
			expect(cycle.currentDay).toBe(1);
			expect(cycle.completedAt).toBeNull();
		}).pipe(Effect.provide(CycleService.test)),
	);

	it.effect("gets current active cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			yield* service.createCycle("user-1", {
				squat: 315,
				bench: 235,
				deadlift: 405,
				ohp: 150,
				unit: "lbs",
			});
			const current = yield* service.getCurrentCycle("user-1");
			expect(current).not.toBeNull();
			expect(current?.squat1rm).toBe(315);
		}).pipe(Effect.provide(CycleService.test)),
	);

	it.effect("returns null when no active cycle", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const current = yield* service.getCurrentCycle("nonexistent");
			expect(current).toBeNull();
		}).pipe(Effect.provide(CycleService.test)),
	);

	it.effect("advances day within a round", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createCycle("user-1", {
				squat: 315,
				bench: 235,
				deadlift: 405,
				ohp: 150,
				unit: "lbs",
			});
			const advanced = yield* service.advancePosition(cycle.id);
			expect(advanced.currentDay).toBe(2);
			expect(advanced.currentRound).toBe(1);
		}).pipe(Effect.provide(CycleService.test)),
	);

	it.effect("wraps to next round after day 5", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createCycle("user-1", {
				squat: 315,
				bench: 235,
				deadlift: 405,
				ohp: 150,
				unit: "lbs",
			});
			// Advance through days 1→2→3→4→5→next round day 1
			for (let i = 0; i < 5; i++) {
				yield* service.advancePosition(cycle.id);
			}
			const current = yield* service.getCurrentCycle("user-1");
			expect(current?.currentRound).toBe(2);
			expect(current?.currentDay).toBe(1);
		}).pipe(Effect.provide(CycleService.test)),
	);

	it.effect("completes cycle after round 4 day 5", () =>
		Effect.gen(function* () {
			const service = yield* CycleService;
			const cycle = yield* service.createCycle("user-1", {
				squat: 315,
				bench: 235,
				deadlift: 405,
				ohp: 150,
				unit: "lbs",
			});
			// 4 rounds * 5 days = 20 advances
			for (let i = 0; i < 20; i++) {
				yield* service.advancePosition(cycle.id);
			}
			const current = yield* service.getCurrentCycle("user-1");
			expect(current).toBeNull(); // cycle is completed
		}).pipe(Effect.provide(CycleService.test)),
	);
});
