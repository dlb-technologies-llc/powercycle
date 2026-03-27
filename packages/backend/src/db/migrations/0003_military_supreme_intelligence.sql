CREATE TABLE "exercise_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slot_key" text NOT NULL,
	"exercise_name" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_prefs_user_slot_key" UNIQUE("user_id","slot_key")
);
--> statement-breakpoint
CREATE INDEX "exercise_prefs_user_id_idx" ON "exercise_preferences" USING btree ("user_id");