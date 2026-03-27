ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cycles" DROP CONSTRAINT IF EXISTS "cycles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workouts" DROP CONSTRAINT IF EXISTS "workouts_user_id_users_id_fk";
--> statement-breakpoint
DROP TABLE "users" CASCADE;
