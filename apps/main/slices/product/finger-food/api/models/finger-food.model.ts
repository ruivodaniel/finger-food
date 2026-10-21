/**
 * FINGER FOOD domain schema, written from erd/design.dbml (the canonical ERD of the slice-design project). Edit the DBML first, then this file.
 * Every table also has created_at and updated_at. Money is numeric(12,2), quantities numeric(14,3), VAT numeric(5,2).
 *
 * A menu line holds components: what is served and what it takes to serve it. A component is an atom: it is bought as it is.
 * One ontology classifies components and menu lines: a tree of terms whose first level is the kind of tree (segments, tags of food,
 * tags of material, event types). One polymorphic mapping links a term to any row of any table. Nothing carries a term column.
 */

import { uomOrganization, uomUser } from "@modules/user-organization-mgmt/models";
import { type AnyPgColumn, boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const washingPlace = pgEnum("washing_place", ["client_kitchen", "warehouse"]);
export const ffUnit = pgEnum("unit", ["piece", "g", "kg", "ml", "l"]);
export const clientKind = pgEnum("client_kind", ["company", "individual"]);
export const eventStage = pgEnum("event_stage", ["lead", "awarded", "closed", "invoiced", "paid"]);
export const operationRole = pgEnum("operation_role", ["operation_manager", "operational"]);
export const proposalState = pgEnum("proposal_state", ["draft", "sent", "accepted", "rejected"]);

const stamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });
const qty = (name: string) => numeric(name, { precision: 14, scale: 3 });
const vat = (name: string) => numeric(name, { precision: 5, scale: 2 });

/** a catering business: an organization of type company. It owns its clients, vendors, ontology, proposal templates, team and distribution rules */
export const ffCateringCompany = pgTable("catering_company", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: text("organization_id").notNull().unique().references(() => uomOrganization.id),
  ...stamps(),
});

/** one term of the ontology: a node of one tree. The first level under the root is the kind of tree */
export const ffOntologyTerm = pgTable("ontology_term", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** the term it is under. Empty for the root */
  parentId: uuid("parent_id").references((): AnyPgColumn => ffOntologyTerm.id),
  ...stamps(),
}, (t) => [uniqueIndex("ontology_term_company_parent_name").on(t.cateringCompanyId, t.parentId, t.name)]);

/** links a term to a row of any table: entity_type is the table (component, menu_line_template, menu_line, moment, proposal_template_moment, event), entity_id the row */
export const ffOntologyMapping = pgTable("ontology_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  ontologyTermId: uuid("ontology_term_id").notNull().references(() => ffOntologyTerm.id),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("ontology_mapping_term_entity").on(t.ontologyTermId, t.entityType, t.entityId), index("ontology_mapping_entity").on(t.entityType, t.entityId)]);

/** the rules of the catering company for one type of moment: what a guest gets, as one typed JSON document (rules with selector term ids, quantity, unit, for_every guests, and a tree of splits with percents) */
export const ffDistributionRuleSet = pgTable("distribution_rule_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  eventTypeTermId: uuid("event_type_term_id").notNull().references(() => ffOntologyTerm.id),
  rules: jsonb("rules").notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("distribution_rule_set_company_type").on(t.cateringCompanyId, t.eventTypeTermId)]);

export const ffVendor = pgTable("vendor", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull().unique(),
  ...stamps(),
});

/** one atom of the catalog: anything an event needs, as it is bought. It has no price and no category: its terms are in the ontology */
export const ffComponent = pgTable("component", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** the unit this component is counted in. Quantities are on the menu line component and on the vendor price */
  unit: ffUnit("unit").notNull(),
  /** true: comes back to the warehouse after the event (a plate, a table). false: consumed or thrown away */
  reusable: boolean("reusable"),
  ...stamps(),
});

/** the price a vendor asks for a quantity of a component in a unit: 10 pieces, 5 kg, 2 l */
export const ffVendorPrice = pgTable("vendor_price", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => ffVendor.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  unit: ffUnit("unit").notNull(),
  price: money("price").notNull(),
  ...stamps(),
});

/** what the warehouse holds of a component, and the day it was counted */
export const ffStock = pgTable("stock", {
  componentId: uuid("component_id").primaryKey().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  countedAt: timestamp("counted_at", { withTimezone: true }).notNull(),
  ...stamps(),
});

export const ffClient = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  kind: clientKind("kind").notNull(),
  /** the tax number (NIF) as written on the invoices */
  taxId: text("tax_id"),
  ...stamps(),
});

export const ffEvent = pgTable("event", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => ffClient.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  place: text("place"),
  washing: washingPlace("washing"),
  budget: money("budget"),
  stage: eventStage("stage").notNull(),
  ...stamps(),
});

export const ffProposalTemplate = pgTable("proposal_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** the picture of the template, a file of the project's Files */
  uploadId: uuid("upload_id"),
  ...stamps(),
});

/** a menu line kept by the system: a thing that is sold, made of components, with the price and the VAT of one of it */
export const ffMenuLineTemplate = pgTable("menu_line_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** what the client pays for one of the line, in the unit of the line */
  price: money("price"),
  vatRate: vat("vat_rate"),
  ...stamps(),
});

/** how many of a component go in one of the template line: quantity 1 for_every 40 is one plate for every 40 pieces */
export const ffMenuLineTemplateComponent = pgTable("menu_line_template_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineTemplateId: uuid("menu_line_template_id").notNull().references(() => ffMenuLineTemplate.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  forEvery: qty("for_every").notNull().default("1"),
  ...stamps(),
});

export const ffProposalTemplateMoment = pgTable("proposal_template_moment", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalTemplateId: uuid("proposal_template_id").notNull().references(() => ffProposalTemplate.id),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffProposalTemplateMomentLine = pgTable("proposal_template_moment_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalTemplateMomentId: uuid("proposal_template_moment_id").notNull().references(() => ffProposalTemplateMoment.id),
  menuLineTemplateId: uuid("menu_line_template_id").notNull().references(() => ffMenuLineTemplate.id),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffProposal = pgTable("proposal", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  number: integer("number").notNull(),
  /** when it was sent to the client. Empty while a draft. From then on the proposal does not change */
  sentAt: timestamp("sent_at", { withTimezone: true }),
  state: proposalState("state").notNull(),
  ...stamps(),
});

/** one moment of a proposal: a coffee break, a cocktail, a catering. Its type is a term under "tipo de evento", through the mapping */
export const ffMoment = pgTable("moment", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => ffProposal.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  guests: integer("guests").notNull(),
  position: integer("position").notNull(),
  ...stamps(),
});

/** one line of the menu of a moment: a copy of a template, or made from scratch; it points to no template */
export const ffMenuLine = pgTable("menu_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  momentId: uuid("moment_id").notNull().references(() => ffMoment.id),
  /** per guest, in the unit below. Filled by the distribution rules of the moment's type, changeable for this moment */
  quantity: qty("quantity").notNull(),
  unit: ffUnit("unit").notNull(),
  /** what the client pays for one of the line. Copied from the template, changeable; fixed once the proposal is sent */
  price: money("price"),
  vatRate: vat("vat_rate"),
  /** the author's note for this line of this proposal, shown on the proposal */
  note: text("note"),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffMenuLineComponent = pgTable("menu_line_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineId: uuid("menu_line_id").notNull().references(() => ffMenuLine.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  forEvery: qty("for_every").notNull().default("1"),
  ...stamps(),
});

export const ffTeamMember = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  userId: text("user_id").notNull().unique().references(() => uomUser.id),
  ...stamps(),
});

export const ffEventMember = pgTable("event_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  teamMemberId: uuid("team_member_id").notNull().references(() => ffTeamMember.id),
  ...stamps(),
});

export const ffOperation = pgTable("operation", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().unique().references(() => ffProposal.id),
  ...stamps(),
});

export const ffStockAllocation = pgTable("stock_allocation", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  ...stamps(),
});

export const ffPurchaseComponent = pgTable("purchase_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  boughtAt: timestamp("bought_at", { withTimezone: true }),
  userId: text("user_id").references(() => uomUser.id),
  ...stamps(),
});

export const ffLogisticsComponent = pgTable("logistics_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  quantity: qty("quantity").notNull(),
  ...stamps(),
});

export const ffOperationMember = pgTable("operation_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  /** empty while the proposal is being costed; filled once the event is awarded */
  teamMemberId: uuid("team_member_id").references(() => ffTeamMember.id),
  role: operationRole("role").notNull(),
  hours: qty("hours").notNull(),
  hourlyRate: money("hourly_rate").notNull(),
  ...stamps(),
});

export const ffProposalAdHocLine = pgTable("proposal_ad_hoc_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => ffProposal.id),
  description: text("description").notNull(),
  quantity: qty("quantity").notNull(),
  price: money("price").notNull(),
  vatRate: vat("vat_rate").notNull(),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffInvoice = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  number: text("number").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  paymentTerms: text("payment_terms"),
  net: money("net").notNull(),
  vat: money("vat").notNull(),
  total: money("total").notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...stamps(),
});

export const ffCreditNote = pgTable("credit_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => ffInvoice.id),
  number: text("number").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  net: money("net").notNull(),
  vat: money("vat").notNull(),
  total: money("total").notNull(),
  reason: text("reason"),
  ...stamps(),
});

export const ffPayment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => ffInvoice.id),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  amount: money("amount").notNull(),
  ...stamps(),
});
