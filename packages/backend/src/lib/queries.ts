import { InternalError } from "@powercycle/shared/errors/index";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { Effect } from "effect";
import {
	cycles,
	exercisePreferences,
	exerciseWeights,
	type NewCycle,
	type NewExerciseWeight,
	type NewWorkout,
	type NewWorkoutSet,
	workoutSets,
	workouts,
} from "../db/schema.js";
import type { Database } from "../services/DatabaseService.js";

const firstRow = <T>(rows: T[]) =>
	rows[0] !== undefined
		? Effect.succeed(rows[0])
		: Effect.fail(
				new InternalError({ message: "Expected row from returning()" }),
			);

export const findActiveCycle = Effect.fn("queries.findActiveCycle")(function* (
	db: Database,
	userId: string,
) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db
				.select()
				.from(cycles)
				.where(and(eq(cycles.userId, userId), isNull(cycles.completedAt)))
				.limit(1),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});
	return rows[0] ?? null;
});

export const insertCycle = Effect.fn("queries.insertCycle")(function* (
	db: Database,
	data: NewCycle,
) {
	const rows = yield* Effect.tryPromise({
		try: () => db.insert(cycles).values(data).returning(),
		catch: (error) => new InternalError({ message: `Insert failed: ${error}` }),
	});
	return yield* firstRow(rows);
});

export const updateCycle = Effect.fn("queries.updateCycle")(function* (
	db: Database,
	cycleId: string,
	data: Partial<NewCycle>,
) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db.update(cycles).set(data).where(eq(cycles.id, cycleId)).returning(),
		catch: (error) => new InternalError({ message: `Update failed: ${error}` }),
	});
	return yield* firstRow(rows);
});

export const findInProgressWorkout = Effect.fn("queries.findInProgressWorkout")(
	function* (db: Database, cycleId: string, round: number, day: number) {
		const rows = yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(workouts)
					.where(
						and(
							eq(workouts.cycleId, cycleId),
							eq(workouts.round, round),
							eq(workouts.day, day),
							isNull(workouts.completedAt),
						),
					)
					.limit(1),
			catch: (error) =>
				new InternalError({ message: `Query failed: ${error}` }),
		});
		return rows[0] ?? null;
	},
);

export const findWorkoutById = Effect.fn("queries.findWorkoutById")(function* (
	db: Database,
	workoutId: string,
) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});
	return rows[0] ?? null;
});

export const insertWorkout = Effect.fn("queries.insertWorkout")(function* (
	db: Database,
	data: NewWorkout,
) {
	const rows = yield* Effect.tryPromise({
		try: () => db.insert(workouts).values(data).returning(),
		catch: (error) => new InternalError({ message: `Insert failed: ${error}` }),
	});
	return yield* firstRow(rows);
});

export const updateWorkout = Effect.fn("queries.updateWorkout")(function* (
	db: Database,
	workoutId: string,
	data: Partial<NewWorkout>,
) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db
				.update(workouts)
				.set(data)
				.where(eq(workouts.id, workoutId))
				.returning(),
		catch: (error) => new InternalError({ message: `Update failed: ${error}` }),
	});
	return yield* firstRow(rows);
});

export const insertWorkoutSet = Effect.fn("queries.insertWorkoutSet")(
	function* (db: Database, data: NewWorkoutSet) {
		const rows = yield* Effect.tryPromise({
			try: () => db.insert(workoutSets).values(data).returning(),
			catch: (error) =>
				new InternalError({ message: `Insert failed: ${error}` }),
		});
		return yield* firstRow(rows);
	},
);

export const findSetsByWorkoutId = Effect.fn("queries.findSetsByWorkoutId")(
	function* (db: Database, workoutId: string) {
		return yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(workoutSets)
					.where(eq(workoutSets.workoutId, workoutId)),
			catch: (error) =>
				new InternalError({ message: `Query failed: ${error}` }),
		});
	},
);

export const findWorkoutHistory = Effect.fn("queries.findWorkoutHistory")(
	function* (db: Database, userId: string) {
		return yield* Effect.tryPromise({
			try: () =>
				db
					.select()
					.from(workouts)
					.where(eq(workouts.userId, userId))
					.orderBy(desc(workouts.startedAt)),
			catch: (error) =>
				new InternalError({ message: `Query failed: ${error}` }),
		});
	},
);

export const countCyclesByUserId = Effect.fn("queries.countCyclesByUserId")(
	function* (db: Database, userId: string) {
		const rows = yield* Effect.tryPromise({
			try: () =>
				db
					.select({ count: count() })
					.from(cycles)
					.where(eq(cycles.userId, userId)),
			catch: (error) =>
				new InternalError({ message: `Query failed: ${error}` }),
		});
		return rows[0]?.count ?? 0;
	},
);

export const findExercisePreferences = Effect.fn(
	"queries.findExercisePreferences",
)(function* (db: Database, userId: string) {
	return yield* Effect.tryPromise({
		try: () =>
			db
				.select()
				.from(exercisePreferences)
				.where(eq(exercisePreferences.userId, userId)),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});
});

export const upsertExercisePreference = Effect.fn(
	"queries.upsertExercisePreference",
)(function* (
	db: Database,
	userId: string,
	slotKey: string,
	exerciseName: string,
) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db
				.insert(exercisePreferences)
				.values({ userId, slotKey, exerciseName })
				.onConflictDoUpdate({
					target: [exercisePreferences.userId, exercisePreferences.slotKey],
					set: { exerciseName, updatedAt: new Date() },
				})
				.returning(),
		catch: (error) => new InternalError({ message: `Upsert failed: ${error}` }),
	});
	return yield* firstRow(rows);
});

export const findExerciseWeightsByUserId = Effect.fn(
	"queries.findExerciseWeightsByUserId",
)(function* (db: Database, userId: string) {
	return yield* Effect.tryPromise({
		try: () =>
			db
				.select()
				.from(exerciseWeights)
				.where(eq(exerciseWeights.userId, userId)),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});
});

export const upsertExerciseWeight = Effect.fn("queries.upsertExerciseWeight")(
	function* (db: Database, data: NewExerciseWeight) {
		const rows = yield* Effect.tryPromise({
			try: () =>
				db
					.insert(exerciseWeights)
					.values(data)
					.onConflictDoUpdate({
						target: [exerciseWeights.userId, exerciseWeights.exerciseName],
						set: {
							weight: data.weight,
							unit: data.unit,
							rpe: data.rpe,
							updatedAt: new Date(),
						},
					})
					.returning(),
			catch: (error) =>
				new InternalError({ message: `Upsert failed: ${error}` }),
		});
		return yield* firstRow(rows);
	},
);

export const deleteExerciseWeight = Effect.fn("queries.deleteExerciseWeight")(
	function* (db: Database, userId: string, exerciseName: string) {
		const rows = yield* Effect.tryPromise({
			try: () =>
				db
					.delete(exerciseWeights)
					.where(
						and(
							eq(exerciseWeights.userId, userId),
							eq(exerciseWeights.exerciseName, exerciseName),
						),
					)
					.returning(),
			catch: (error) =>
				new InternalError({ message: `Delete failed: ${error}` }),
		});
		return rows.length > 0;
	},
);

export const findLatestCompletedCycleMaxes = Effect.fn(
	"queries.findLatestCompletedCycleMaxes",
)(function* (db: Database, userId: string) {
	const rows = yield* Effect.tryPromise({
		try: () =>
			db
				.select({
					squat1rm: cycles.squat1rm,
					bench1rm: cycles.bench1rm,
					deadlift1rm: cycles.deadlift1rm,
					ohp1rm: cycles.ohp1rm,
					unit: cycles.unit,
				})
				.from(cycles)
				.where(and(eq(cycles.userId, userId), isNotNull(cycles.completedAt)))
				.orderBy(desc(cycles.completedAt))
				.limit(1),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});
	return rows[0] ?? null;
});

export const findLastSessionSets = Effect.fn("queries.findLastSessionSets")(
	function* (db: Database, userId: string) {
		return yield* Effect.tryPromise({
			try: () =>
				db
					.select({
						exerciseName: workoutSets.exerciseName,
						actualWeight: workoutSets.actualWeight,
						actualReps: workoutSets.actualReps,
						rpe: workoutSets.rpe,
						completedAt: workouts.completedAt,
					})
					.from(workoutSets)
					.innerJoin(workouts, eq(workoutSets.workoutId, workouts.id))
					.where(
						and(eq(workouts.userId, userId), isNotNull(workouts.completedAt)),
					)
					.orderBy(desc(workouts.completedAt)),
			catch: (error) =>
				new InternalError({ message: `Query failed: ${error}` }),
		});
	},
);
