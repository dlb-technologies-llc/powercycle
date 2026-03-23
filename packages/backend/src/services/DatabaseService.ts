import { drizzle } from "drizzle-orm/postgres-js";
import { Layer, ServiceMap } from "effect";
import postgres from "postgres";
import * as schema from "../db/schema.js";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export class DatabaseService extends ServiceMap.Service<
	DatabaseService,
	{
		readonly db: Database;
	}
>()("DatabaseService") {
	static layer(url: string) {
		return Layer.succeed(DatabaseService)({
			db: drizzle(postgres(url), { schema }),
		});
	}

	static test(mockDb: Database) {
		return Layer.succeed(DatabaseService)({
			db: mockDb,
		});
	}
}
