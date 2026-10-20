CREATE TYPE "public"."notification_channel" AS ENUM('in_app', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('pending', 'sent', 'delivered', 'seen', 'dismissed', 'failed', 'suppressed_by_pref', 'superseded');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"template" text NOT NULL,
	"message_type" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dedupe_key" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"notification_id" text NOT NULL,
	"recipient_user_id" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_delivery_status" NOT NULL,
	"template" text NOT NULL,
	"dedupe_key" text,
	"address" text,
	"preference_snapshot" jsonb NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"seen_at" timestamp,
	"dismissed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"message_type" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_delivery_inbox_idx" ON "notification_delivery" USING btree ("recipient_user_id","channel","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_delivery_notification_idx" ON "notification_delivery" USING btree ("notification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_supersede_uniq" ON "notification_delivery" USING btree ("recipient_user_id","template","dedupe_key") WHERE dedupe_key is not null and channel = 'in_app'
            and status in ('pending','sent','delivered','seen');--> statement-breakpoint
CREATE UNIQUE INDEX "notification_delivery_idempotency_uniq" ON "notification_delivery" USING btree ("recipient_user_id","channel","template","dedupe_key") WHERE dedupe_key is not null and channel <> 'in_app' and status <> 'failed';--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preference_user_type_channel_uniq" ON "notification_preference" USING btree ("user_id","message_type","channel");