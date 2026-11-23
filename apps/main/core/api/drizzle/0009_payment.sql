CREATE TYPE "public"."payment_kind" AS ENUM('subscription', 'bundle', 'purchase', 'invoice', 'refund', 'chargeback', 'chargeback_reversal');--> statement-breakpoint
CREATE TYPE "public"."refund_policy" AS ENUM('money', 'credits', 'either');--> statement-breakpoint
CREATE TYPE "public"."paid_with" AS ENUM('card', 'vendor_credits');--> statement-breakpoint
CREATE TABLE "payment_account" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"user_id" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan_key" text,
	"subscription_status" text,
	"current_period_end" timestamp,
	"stripe_account_id" text,
	"charges_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "payment_account_one_owner_check" CHECK ((organization_id is null) <> (user_id is null))
);
--> statement-breakpoint
CREATE TABLE "payment_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"kind" "payment_kind" NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"description" text NOT NULL,
	"stripe_ref" text NOT NULL,
	"payment_intent_id" text,
	"credit_source_ref" text,
	"credits_granted" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit_amount" integer NOT NULL,
	"currency" text NOT NULL,
	"refund_policy" "refund_policy" DEFAULT 'money' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "product_unit_amount_check" CHECK (unit_amount > 0)
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"seller_organization_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"paid_with" "paid_with" NOT NULL,
	"amount_total" integer NOT NULL,
	"currency" text NOT NULL,
	"application_fee_amount" integer NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"refunded_amount" integer DEFAULT 0 NOT NULL,
	"refunded_at" timestamp,
	"credits_refunded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_ledger" ADD CONSTRAINT "payment_ledger_account_id_payment_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."payment_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_account_id_payment_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."payment_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_account_organization_uniq" ON "payment_account" USING btree ("organization_id") WHERE organization_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_account_user_uniq" ON "payment_account" USING btree ("user_id") WHERE user_id is not null;--> statement-breakpoint
CREATE INDEX "payment_ledger_account_idx" ON "payment_ledger" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_ledger_intent_idx" ON "payment_ledger" USING btree ("payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_ledger_ref_uniq" ON "payment_ledger" USING btree ("stripe_ref","kind");--> statement-breakpoint
CREATE INDEX "stripe_event_type_idx" ON "stripe_event" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "product_organization_idx" ON "product" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_marketplace_idx" ON "product" USING btree ("created_at") WHERE active;--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_checkout_session_uniq" ON "purchase" USING btree ("stripe_checkout_session_id") WHERE stripe_checkout_session_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "purchase_payment_intent_uniq" ON "purchase" USING btree ("stripe_payment_intent_id") WHERE stripe_payment_intent_id is not null;--> statement-breakpoint
CREATE INDEX "purchase_buyer_idx" ON "purchase" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "purchase_seller_idx" ON "purchase" USING btree ("seller_organization_id","created_at");