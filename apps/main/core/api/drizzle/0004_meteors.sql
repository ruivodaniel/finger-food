CREATE TYPE "public"."meteor_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "meteor" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"diameter_km" numeric,
	"discovered_at" date,
	"status" "meteor_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "meteor_org_idx" ON "meteor" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "meteor_status_idx" ON "meteor" USING btree ("status");