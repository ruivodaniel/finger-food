CREATE TABLE "document_lock" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"document_id" text NOT NULL,
	"locked_by" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "one_lock_per_document" ON "document_lock" USING btree ("kind","document_id");