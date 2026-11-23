CREATE TYPE "public"."preference_source" AS ENUM('system', 'explicit');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"locale_source" "preference_source",
	"locale_value" text,
	"timezone_source" "preference_source",
	"timezone_value" text,
	"currency_value" text,
	"country_value" text,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;