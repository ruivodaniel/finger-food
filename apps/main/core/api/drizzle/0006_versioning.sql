CREATE TYPE "public"."author_type" AS ENUM('user', 'agent', 'deterministic');--> statement-breakpoint
CREATE TYPE "public"."origin_kind" AS ENUM('first', 'continuation', 'branch', 'merge');--> statement-breakpoint
CREATE TABLE "outer_capsule" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "outer_capsule_entity_id_unique" UNIQUE("entity_id")
);
--> statement-breakpoint
CREATE TABLE "branch" (
	"id" text PRIMARY KEY NOT NULL,
	"outer_capsule_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inner_capsule" (
	"id" text PRIMARY KEY NOT NULL,
	"outer_capsule_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_row_id" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	"origin_kind" "origin_kind" NOT NULL,
	"author_id" text NOT NULL,
	"author_type" "author_type" NOT NULL,
	"instructed_by_id" text,
	"author_workflow_id" text,
	"author_model_version" text,
	"title" text,
	"slug" text,
	"is_main" boolean NOT NULL,
	"source_version_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"intent_what" text,
	"intent_why" text,
	"seq" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "version_delta" (
	"id" text PRIMARY KEY NOT NULL,
	"from_inner_capsule_id" text NOT NULL,
	"to_inner_capsule_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"fields" jsonb NOT NULL,
	"computed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "release" (
	"id" text PRIMARY KEY NOT NULL,
	"outer_capsule_id" text NOT NULL,
	"inner_capsule_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text,
	"description" text,
	"author_id" text NOT NULL,
	"author_type" "author_type" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "branch" ADD CONSTRAINT "branch_outer_capsule_id_outer_capsule_id_fk" FOREIGN KEY ("outer_capsule_id") REFERENCES "public"."outer_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_capsule" ADD CONSTRAINT "inner_capsule_outer_capsule_id_outer_capsule_id_fk" FOREIGN KEY ("outer_capsule_id") REFERENCES "public"."outer_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inner_capsule" ADD CONSTRAINT "inner_capsule_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_delta" ADD CONSTRAINT "version_delta_from_inner_capsule_id_inner_capsule_id_fk" FOREIGN KEY ("from_inner_capsule_id") REFERENCES "public"."inner_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "version_delta" ADD CONSTRAINT "version_delta_to_inner_capsule_id_inner_capsule_id_fk" FOREIGN KEY ("to_inner_capsule_id") REFERENCES "public"."inner_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release" ADD CONSTRAINT "release_outer_capsule_id_outer_capsule_id_fk" FOREIGN KEY ("outer_capsule_id") REFERENCES "public"."outer_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "release" ADD CONSTRAINT "release_inner_capsule_id_inner_capsule_id_fk" FOREIGN KEY ("inner_capsule_id") REFERENCES "public"."inner_capsule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branch_name_per_outer" ON "branch" USING btree ("outer_capsule_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "one_head_per_branch" ON "inner_capsule" USING btree ("branch_id") WHERE "inner_capsule"."valid_to" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "seq_per_branch" ON "inner_capsule" USING btree ("branch_id","seq");--> statement-breakpoint
CREATE UNIQUE INDEX "slug_among_main_heads" ON "inner_capsule" USING btree ("entity_type","slug") WHERE "inner_capsule"."valid_to" is null and "inner_capsule"."is_main" and "inner_capsule"."slug" is not null;--> statement-breakpoint
CREATE INDEX "inner_capsule_by_row" ON "inner_capsule" USING btree ("entity_type","entity_row_id");--> statement-breakpoint
CREATE INDEX "inner_capsule_by_outer" ON "inner_capsule" USING btree ("outer_capsule_id","branch_id","valid_from");--> statement-breakpoint
CREATE UNIQUE INDEX "one_delta_per_pair" ON "version_delta" USING btree ("from_inner_capsule_id","to_inner_capsule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "release_number_per_outer" ON "release" USING btree ("outer_capsule_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "one_current_release" ON "release" USING btree ("outer_capsule_id") WHERE "release"."valid_to" is null;