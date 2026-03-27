import { InternalError } from "@powercycle/shared/errors/index";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Effect } from "effect";
import {
	cycles,
	type NewCycle,
	type NewWorkout,
	type NewWorkoutSet,
	workoutSets,
	workouts,
} from "../db/schema.js";
import type { Database } from "../services/DatabaseService.js";

export const findActiveCycle = (db: Database, userId: string) =>
	Effect.tryPromise({
		try: () =>
			db
				.select()
				.from(cycles)
				.where(and(eq(cycles.userId, userId), isNull(cycles.completedAt)))
				.limit(1),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0] ?? null));

export const insertCycle = (db: Database, data: NewCycle) =>
	Effect.tryPromise({
		try: () => db.insert(cycles).values(data).returning(),
		catch: (error) => new InternalError({ message: `Insert failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0]!));

export const updateCycle = (
	db: Database,
	cycleId: string,
	data: Partial<NewCycle>,
) =>
	Effect.tryPromise({
		try: () =>
			db.update(cycles).set(data).where(eq(cycles.id, cycleId)).returning(),
		catch: (error) => new InternalError({ message: `Update failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0]!));

export const findInProgressWorkout = (
	db: Database,
	cycleId: string,
	round: number,
	day: number,
) =>
	Effect.tryPromise({
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
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0] ?? null));

export const findWorkoutById = (db: Database, workoutId: string) =>
	Effect.tryPromise({
		try: () =>
			db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0] ?? null));

export const insertWorkout = (db: Database, data: NewWorkout) =>
	Effect.tryPromise({
		try: () => db.insert(workouts).values(data).returning(),
		catch: (error) => new InternalError({ message: `Insert failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0]!));

export const updateWorkout = (
	db: Database,
	workoutId: string,
	data: Partial<NewWorkout>,
) =>
	Effect.tryPromise({
		try: () =>
			db
				.update(workouts)
				.set(data)
				.where(eq(workouts.id, workoutId))
				.returning(),
		catch: (error) => new InternalError({ message: `Update failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0]!));

export const insertWorkoutSet = (db: Database, data: NewWorkoutSet) =>
	Effect.tryPromise({
		try: () => db.insert(workoutSets).values(data).returning(),
		catch: (error) => new InternalError({ message: `Insert failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows[0]!));

export const findSetsByWorkoutId = (db: Database, workoutId: string) =>
	Effect.tryPromise({
		try: () =>
			db.select().from(workoutSets).where(eq(workoutSets.workoutId, workoutId)),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});

export const findWorkoutHistory = (db: Database, userId: string) =>
	Effect.tryPromise({
		try: () =>
			db
				.select()
				.from(workouts)
				.where(eq(workouts.userId, userId))
				.orderBy(desc(workouts.startedAt)),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	});

export const countCyclesByUserId = (db: Database, userId: string) =>
	Effect.tryPromise({
		try: () => db.select().from(cycles).where(eq(cycles.userId, userId)),
		catch: (error) => new InternalError({ message: `Query failed: ${error}` }),
	}).pipe(Effect.map((rows) => rows.length));
