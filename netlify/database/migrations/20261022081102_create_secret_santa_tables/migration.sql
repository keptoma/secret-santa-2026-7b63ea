CREATE TABLE "assignments" (
	"id" serial PRIMARY KEY,
	"giver_id" integer NOT NULL UNIQUE,
	"receiver_id" integer NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_state" (
	"id" integer PRIMARY KEY,
	"registration_closed" boolean DEFAULT false NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"name_key" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"wishlist" text NOT NULL,
	"links" text DEFAULT '' NOT NULL,
	"dislikes" text DEFAULT '' NOT NULL,
	"hobbies" text DEFAULT '' NOT NULL,
	"sizes" text DEFAULT '' NOT NULL,
	"code_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_giver_id_participants_id_fkey" FOREIGN KEY ("giver_id") REFERENCES "participants"("id");--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_receiver_id_participants_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "participants"("id");