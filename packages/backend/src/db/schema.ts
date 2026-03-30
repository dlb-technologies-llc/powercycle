import {
	boolean,
	index,
	integer,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const cycles = pgTable(
	"cycles",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		cycleNumber: integer("cycle_number").notNull(),
		squat1rm: numeric("squat_1rm"),
		bench1rm: numeric("bench_1rm"),
		deadlift1rm: numeric("deadlift_1rm"),
		ohp1rm: numeric("ohp_1rm"),
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
		setDuration: integer("set_duration"),
		restDuration: integer("rest_duration"),
		skipped: boolean("skipped").default(false).notNull(),
		completedAt: timestamp("completed_at"),
	},
	(table) => [index("workout_sets_workout_id_idx").on(table.workoutId)],
);

export const exercisePreferences = pgTable(
	"exercise_preferences",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		slotKey: text("slot_key").notNull(),
		exerciseName: text("exercise_name").notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("exercise_prefs_user_id_idx").on(table.userId),
		unique("exercise_prefs_user_slot_key").on(table.userId, table.slotKey),
	],
);

export const exerciseWeights = pgTable(
	"exercise_weights",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id").notNull(),
		exerciseName: text("exercise_name").notNull(),
		weight: numeric("weight").notNull(),
		unit: text("unit").notNull().default("lbs"),
		rpe: numeric("rpe"),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => [
		index("exercise_weights_user_id_idx").on(table.userId),
		unique("exercise_weights_user_exercise").on(
			table.userId,
			table.exerciseName,
		),
	],
);

// Type exports
export type Cycle = typeof cycles.$inferSelect;
export type NewCycle = typeof cycles.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type NewWorkoutSet = typeof workoutSets.$inferInsert;
export type ExercisePreference = typeof exercisePreferences.$inferSelect;
export type NewExercisePreference = typeof exercisePreferences.$inferInsert;
export type ExerciseWeight = typeof exerciseWeights.$inferSelect;
export type NewExerciseWeight = typeof exerciseWeights.$inferInsert;
