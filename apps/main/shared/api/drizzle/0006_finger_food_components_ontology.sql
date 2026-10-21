ALTER TABLE "item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "item_category" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menu_line_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "menu_line_template_item" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "unit" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "item" CASCADE;--> statement-breakpoint
DROP TABLE "item_category" CASCADE;--> statement-breakpoint
DROP TABLE "menu_line_item" CASCADE;--> statement-breakpoint
DROP TABLE "menu_line_template_item" CASCADE;--> statement-breakpoint
DROP TABLE "unit" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('piece', 'g', 'kg', 'ml', 'l');--> statement-breakpoint
CREATE TYPE "public"."washing_place" AS ENUM('client_kitchen', 'warehouse');--> statement-breakpoint
ALTER TYPE "public"."event_stage" ADD VALUE 'closed';--> statement-breakpoint
ALTER TYPE "public"."event_stage" ADD VALUE 'invoiced';--> statement-breakpoint
ALTER TYPE "public"."event_stage" ADD VALUE 'paid';--> statement-breakpoint
CREATE TABLE "catering_company" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catering_company_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "credit_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"number" text NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"net" numeric(12, 2) NOT NULL,
	"vat" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_note_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "distribution_rule_set" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catering_company_id" uuid NOT NULL,
	"event_type_term_id" uuid NOT NULL,
	"rules" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logistics_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_line_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_line_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"for_every" numeric(14, 3) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_line_template_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_line_template_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"for_every" numeric(14, 3) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ontology_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ontology_term_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ontology_term" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catering_company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_ad_hoc_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"vat_rate" numeric(5, 2) NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_component" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"bought_at" timestamp with time zone,
	"user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" uuid NOT NULL,
	"component_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "component" DROP CONSTRAINT IF EXISTS "component_assembly_id_item_id_fk";
--> statement-breakpoint
ALTER TABLE "component" DROP CONSTRAINT IF EXISTS "component_part_id_item_id_fk";
--> statement-breakpoint
ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "stock_item_id_item_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_price" DROP CONSTRAINT IF EXISTS "vendor_price_item_id_item_id_fk";
--> statement-breakpoint
ALTER TABLE "vendor_price" DROP CONSTRAINT IF EXISTS "vendor_price_unit_id_unit_id_fk";
--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "catering_company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "tax_id" text;--> statement-breakpoint
ALTER TABLE "component" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "component" ADD COLUMN "unit" "unit" NOT NULL;--> statement-breakpoint
ALTER TABLE "component" ADD COLUMN "reusable" boolean;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "ends_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "place" text;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "washing" "washing_place";--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "issued_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_terms" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "net" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "vat" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "total" numeric(12, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "menu_line" ADD COLUMN "quantity" numeric(14, 3) NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_line" ADD COLUMN "unit" "unit" NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_line" ADD COLUMN "price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "menu_line" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "menu_line" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "menu_line_template" ADD COLUMN "price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "menu_line_template" ADD COLUMN "vat_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "moment" ADD COLUMN "starts_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "moment" ADD COLUMN "ends_at" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "proposal_template" ADD COLUMN "catering_company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "stock" DROP CONSTRAINT IF EXISTS "stock_pkey";--> statement-breakpoint
ALTER TABLE "stock" DROP COLUMN IF EXISTS "item_id";--> statement-breakpoint
ALTER TABLE "stock" ADD COLUMN "component_id" uuid PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "team_member" ADD COLUMN "catering_company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor" ADD COLUMN "catering_company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_price" ADD COLUMN "component_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "vendor_price" ADD COLUMN "unit" "unit" NOT NULL;--> statement-breakpoint
ALTER TABLE "catering_company" ADD CONSTRAINT "catering_company_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_note" ADD CONSTRAINT "credit_note_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_rule_set" ADD CONSTRAINT "distribution_rule_set_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_rule_set" ADD CONSTRAINT "distribution_rule_set_event_type_term_id_ontology_term_id_fk" FOREIGN KEY ("event_type_term_id") REFERENCES "public"."ontology_term"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_component" ADD CONSTRAINT "logistics_component_operation_id_operation_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logistics_component" ADD CONSTRAINT "logistics_component_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_line_component" ADD CONSTRAINT "menu_line_component_menu_line_id_menu_line_id_fk" FOREIGN KEY ("menu_line_id") REFERENCES "public"."menu_line"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_line_component" ADD CONSTRAINT "menu_line_component_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_line_template_component" ADD CONSTRAINT "menu_line_template_component_menu_line_template_id_menu_line_template_id_fk" FOREIGN KEY ("menu_line_template_id") REFERENCES "public"."menu_line_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_line_template_component" ADD CONSTRAINT "menu_line_template_component_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ontology_mapping" ADD CONSTRAINT "ontology_mapping_ontology_term_id_ontology_term_id_fk" FOREIGN KEY ("ontology_term_id") REFERENCES "public"."ontology_term"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ontology_term" ADD CONSTRAINT "ontology_term_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ontology_term" ADD CONSTRAINT "ontology_term_parent_id_ontology_term_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ontology_term"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoice"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_ad_hoc_line" ADD CONSTRAINT "proposal_ad_hoc_line_proposal_id_proposal_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_component" ADD CONSTRAINT "purchase_component_operation_id_operation_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_component" ADD CONSTRAINT "purchase_component_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_component" ADD CONSTRAINT "purchase_component_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_allocation" ADD CONSTRAINT "stock_allocation_operation_id_operation_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."operation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_allocation" ADD CONSTRAINT "stock_allocation_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "distribution_rule_set_company_type" ON "distribution_rule_set" USING btree ("catering_company_id","event_type_term_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ontology_mapping_term_entity" ON "ontology_mapping" USING btree ("ontology_term_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "ontology_mapping_entity" ON "ontology_mapping" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ontology_term_company_parent_name" ON "ontology_term" USING btree ("catering_company_id","parent_id","name");--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_template" ADD CONSTRAINT "proposal_template_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock" ADD CONSTRAINT "stock_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor" ADD CONSTRAINT "vendor_catering_company_id_catering_company_id_fk" FOREIGN KEY ("catering_company_id") REFERENCES "public"."catering_company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_price" ADD CONSTRAINT "vendor_price_component_id_component_id_fk" FOREIGN KEY ("component_id") REFERENCES "public"."component"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "component" DROP COLUMN "assembly_id";--> statement-breakpoint
ALTER TABLE "component" DROP COLUMN "part_id";--> statement-breakpoint
ALTER TABLE "component" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "menu_line" DROP COLUMN "segment";--> statement-breakpoint
ALTER TABLE "menu_line_template" DROP COLUMN "segment";--> statement-breakpoint
ALTER TABLE "moment" DROP COLUMN "service_type";--> statement-breakpoint
ALTER TABLE "moment" DROP COLUMN "units_per_guest";--> statement-breakpoint
ALTER TABLE "proposal_template_moment" DROP COLUMN "service_type";--> statement-breakpoint
ALTER TABLE "proposal_template_moment" DROP COLUMN "units_per_guest";--> statement-breakpoint
ALTER TABLE "vendor_price" DROP COLUMN "item_id";--> statement-breakpoint
ALTER TABLE "vendor_price" DROP COLUMN "unit_id";--> statement-breakpoint
ALTER TABLE "component" ADD CONSTRAINT "component_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_number_unique" UNIQUE("number");--> statement-breakpoint
DROP TYPE "public"."menu_segment";--> statement-breakpoint
DROP TYPE "public"."service_type";--> statement-breakpoint
DROP TYPE "public"."unit_dimension";