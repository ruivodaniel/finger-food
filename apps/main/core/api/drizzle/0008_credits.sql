CREATE TYPE "public"."lot_reason" AS ENUM('plan', 'top_up', 'welcome', 'admin_grant', 'allocation', 'vendor_refund', 'promotion');--> statement-breakpoint
CREATE TYPE "public"."ledger_reason" AS ENUM('grant', 'charge', 'refund', 'expire', 'take_back');--> statement-breakpoint
CREATE TYPE "public"."allocation_period" AS ENUM('day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "public"."unspent_mode" AS ENUM('top_up', 'replace');--> statement-breakpoint
CREATE TABLE "credit_account" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"user_id" text,
	"price_list" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "credit_account_one_owner_check" CHECK ((organization_id is null) <> (user_id is null))
);
--> statement-breakpoint
CREATE TABLE "credit_lot" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"vendor_organization_id" text,
	"service_keys" text[],
	"reason" "lot_reason" NOT NULL,
	"priority" integer NOT NULL,
	"amount" integer NOT NULL,
	"remaining" integer NOT NULL,
	"expires_at" timestamp,
	"source_ref" text,
	"issued_by_user_id" text,
	"note" text,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "credit_lot_amount_check" CHECK (amount > 0 and remaining >= 0 and remaining <= amount)
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"lot_id" text NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"delta" integer NOT NULL,
	"lot_remaining_after" integer NOT NULL,
	"service_key" text,
	"user_id" text,
	"ref" text,
	"source_event_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_allowance" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"user_id" text,
	"organization_id" text NOT NULL,
	"period" "allocation_period" NOT NULL,
	"unspent" "unspent_mode" NOT NULL,
	"credits" integer NOT NULL,
	"service_keys" text[],
	"creates_credits" boolean DEFAULT false NOT NULL,
	"inherited" boolean DEFAULT false NOT NULL,
	"carried" integer DEFAULT 0 NOT NULL,
	"counted_from" timestamp NOT NULL,
	"accrues_from" timestamp NOT NULL,
	"issued_until" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "member_allowance_credits_check" CHECK (credits > 0 and carried >= 0)
);
--> statement-breakpoint
ALTER TABLE "credit_lot" ADD CONSTRAINT "credit_lot_account_id_credit_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_account_id_credit_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_lot_id_credit_lot_id_fk" FOREIGN KEY ("lot_id") REFERENCES "public"."credit_lot"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_allowance" ADD CONSTRAINT "member_allowance_account_id_credit_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."credit_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_account_organization_uniq" ON "credit_account" USING btree ("organization_id") WHERE organization_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_account_user_uniq" ON "credit_account" USING btree ("user_id") WHERE user_id is not null;--> statement-breakpoint
CREATE INDEX "credit_lot_draw_idx" ON "credit_lot" USING btree ("account_id","vendor_organization_id","priority","expires_at");--> statement-breakpoint
CREATE INDEX "credit_lot_account_idx" ON "credit_lot" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_lot_source_uniq" ON "credit_lot" USING btree ("source_ref") WHERE source_ref is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_lot_welcome_uniq" ON "credit_lot" USING btree ("account_id") WHERE reason = 'welcome';--> statement-breakpoint
CREATE INDEX "credit_ledger_account_idx" ON "credit_ledger" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "credit_ledger_member_idx" ON "credit_ledger" USING btree ("account_id","user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_ledger_ref_uniq" ON "credit_ledger" USING btree ("ref","reason","lot_id") WHERE ref is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "member_allowance_member_uniq" ON "member_allowance" USING btree ("account_id","user_id") WHERE user_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "member_allowance_default_uniq" ON "member_allowance" USING btree ("account_id") WHERE user_id is null;