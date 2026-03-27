import {
	boolean,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const cycles = pgTable(
	"cycles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		cycleNumber: integer("cycle_number").notNull(),
		squat1rm: numeric("squat_1rm").notNull(),
		bench1rm: numeric("bench_1rm").notNull(),
		deadlift1rm: numeric("deadlift_1rm").notNull(),
		ohp1rm: numeric("ohp_1rm").notNull(),
		unit: text("unit").notNull().default("lbs"),
		currentRound: integer("current_round").notNull().default(1),
		currentDay: integer("current_day").notNull().default(1),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
	},
	(table) => [index("cycles_user_id_idx").on(table.userId)],
);

export const workouts = pgTable(
	"workouts",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		cycleId: uuid("cycle_id")
			.notNull()
			.references(() => cycles.id),
		round: integer("round").notNull(),
		day: integer("day").notNull(),
		startedAt: timestamp("started_at").defaultNow().notNull(),
		completedAt: timestamp("completed_at"),
	},
	(table) => [
		index("workouts_user_id_idx").on(table.userId),
		index("workouts_cycle_id_idx").on(table.cycleId),
	],
);

export const workoutSets = pgTable(
	"workout_sets",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workoutId: uuid("workout_id")
			.notNull()
			.references(() => workouts.id),
		exerciseName: text("exercise_name").notNull(),
		category: text("category"),
		setNumber: integer("set_number").notNull(),
		prescribedWeight: numeric("prescribed_weight"),
		actualWeight: numeric("actual_weight"),
		prescribedReps: integer("prescribed_reps"),
		actualReps: integer("actual_reps"),
		prescribedRpeMin: numeric("prescribed_rpe_min"),
		prescribedRpeMax: numeric("prescribed_rpe_max"),
		rpe: numeric("rpe"),
		isMainLift: boolean("is_main_lift").notNull().default(false),
		isAmrap: boolean("is_amrap").notNull().default(false),
		completedAt: timestamp("completed_at"),
	},
	(table) => [index("workout_sets_workout_id_idx").on(table.workoutId)],
);

// Type exports
export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
