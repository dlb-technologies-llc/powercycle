CREATE TABLE "cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_number" integer NOT NULL,
	"squat_1rm" numeric,
	"bench_1rm" numeric,
	"deadlift_1rm" numeric,
	"ohp_1rm" numeric,
	"unit" text DEFAULT 'lbs' NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"current_day" integer DEFAULT 1 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "exercise_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_key" text NOT NULL,
	"exercise_name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_prefs_user_slot_key" UNIQUE("user_id","slot_key")
);
--> statement-breakpoint
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
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_id" uuid NOT NULL,
	"exercise_name" text NOT NULL,
	"category" text,
	"set_number" integer NOT NULL,
	"prescribed_weight" numeric,
	"actual_weight" numeric,
	"prescribed_reps" integer,
	"actual_reps" integer,
	"prescribed_rpe_min" numeric,
	"prescribed_rpe_max" numeric,
	"rpe" numeric,
	"is_main_lift" boolean DEFAULT false NOT NULL,
	"is_amrap" boolean DEFAULT false NOT NULL,
	"set_duration" integer,
	"rest_duration" integer,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"day" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_cycle_id_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cycles_user_id_idx" ON "cycles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercise_prefs_user_id_idx" ON "exercise_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exercise_weights_user_id_idx" ON "exercise_weights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workout_sets_workout_id_idx" ON "workout_sets" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "workouts_user_id_idx" ON "workouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workouts_cycle_id_idx" ON "workouts" USING btree ("cycle_id");