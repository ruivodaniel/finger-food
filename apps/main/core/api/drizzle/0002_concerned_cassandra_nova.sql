CREATE TYPE "public"."workflow_intent_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "workflow_intent" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" "workflow_intent_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"dedupe_key" text,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"claimed_by" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"last_error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "workflow_intent_status_available_at_idx" ON "workflow_intent" USING btree ("status","available_at");--> statement-breakpoint
CREATE INDEX "workflow_intent_status_claimed_at_idx" ON "workflow_intent" USING btree ("status","claimed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_intent_kind_dedupe_active_idx" ON "workflow_intent" USING btree ("kind","dedupe_key") WHERE dedupe_key is not null and status in ('pending', 'processing');