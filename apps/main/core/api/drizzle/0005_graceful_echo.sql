CREATE TYPE "public"."chat_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."chat_message_status" AS ENUM('complete', 'error');--> statement-breakpoint
CREATE TABLE "chat" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text,
	"title" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" "chat_message_role" NOT NULL,
	"content" text NOT NULL,
	"reply_to" text,
	"run_id" text,
	"status" "chat_message_status" DEFAULT 'complete' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "chat_message_reply_to_unique" UNIQUE("reply_to")
);
--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_user_updated_idx" ON "chat" USING btree ("user_id","updated_at","id");--> statement-breakpoint
CREATE INDEX "chat_message_chat_created_idx" ON "chat_message" USING btree ("chat_id","created_at","id");--> statement-breakpoint
CREATE INDEX "chat_message_user_created_idx" ON "chat_message" USING btree ("created_at") WHERE "chat_message"."role" = 'user';