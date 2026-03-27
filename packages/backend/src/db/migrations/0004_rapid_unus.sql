CREATE TABLE "exercise_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exercise_name" text NOT NULL,
	"weight" numeric NOT NULL,
	"unit" text DEFAULT 'lbs' NOT NULL,
	"rpe" numeric,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_weights_user_exercise" UNIQUE("user_id","exercise_name")
);
--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "squat_1rm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "bench_1rm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "deadlift_1rm" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cycles" ALTER COLUMN "ohp_1rm" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "exercise_weights_user_id_idx" ON "exercise_weights" USING btree ("user_id");