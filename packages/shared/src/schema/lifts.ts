import { Schema } from "effect";

export const MainLift = Schema.Literals(["squat", "bench", "deadlift", "ohp"]);
export type MainLift = typeof MainLift.Type;

export const Unit = Schema.Literals(["lbs", "kg"]);
export type Unit = typeof Unit.Type;

export const LIFT_DISPLAY_NAMES: Record<MainLift, string> = {
	squat: "Squat",
	bench: "Bench Press",
	deadlift: "Deadlift",
	ohp: "Overhead Press",
};

export const PLATE_INCREMENT: Record<Unit, number> = {
	lbs: 5,
	kg: 2.5,
};

export const UserLifts = Schema.Struct({
	squat: Schema.NullOr(Schema.Number),
	bench: Schema.NullOr(Schema.Number),
	deadlift: Schema.NullOr(Schema.Number),
	ohp: Schema.NullOr(Schema.Number),
	unit: Unit,
});
export type UserLifts = typeof UserLifts.Type;
