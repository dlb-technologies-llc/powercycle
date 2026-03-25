import { Layer } from "effect";
import { ConfigTest } from "../../src/services/ConfigService.js";
import { CycleLive } from "../../src/services/CycleService.js";
import {
	type Database,
	DatabaseService,
} from "../../src/services/DatabaseService.js";
import { WorkoutLive } from "../../src/services/WorkoutService.js";

export const createMockDatabaseLayer = (mockDb: Partial<Database>) =>
	Layer.succeed(DatabaseService)({ db: mockDb as Database });

export const ServiceTestLayer = Layer.mergeAll(
	CycleLive,
	WorkoutLive,
	ConfigTest,
);
