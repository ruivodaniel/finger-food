CREATE TABLE "identity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_address" (
	"id" text PRIMARY KEY NOT NULL,
	"identity_id" text NOT NULL,
	"via" text NOT NULL,
	"value" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "identity_address_value_unique" UNIQUE("value")
);
--> statement-breakpoint
CREATE TABLE "identity_flow" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"identifier" text,
	"traits" jsonb,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token_hash" text NOT NULL,
	"identity_id" text NOT NULL,
	"methods" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"authenticated_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "identity_session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "identity_address_identity_idx" ON "identity_address" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "identity_session_identity_idx" ON "identity_session" USING btree ("identity_id");