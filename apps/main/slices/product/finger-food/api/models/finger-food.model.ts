/**
 * FINGER FOOD domain schema. GENERATED from erd/design.dbml by scripts/finger-food/generate-model.py: edit the DBML, then run it.
 * Every table also has created_at and updated_at. Money is numeric(12,2), quantities numeric(14,3), VAT and percents numeric(5,2).
 * The ERD's table "purchase" is "article_purchase" in the database: the seed's payment slice already has a table called purchase.
 */

import { uomOrganization, uomUser } from "@modules/user-organization-mgmt/models";
import { type AnyPgColumn, boolean, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const washingPlace = pgEnum("washing_place", ["client_kitchen", "warehouse"]);
export const ffUnit = pgEnum("unit", ["piece", "mg", "g", "kg", "ml", "l"]);
export const clientKind = pgEnum("client_kind", ["company", "individual"]);
export const eventStage = pgEnum("event_stage", ["lead", "awarded", "closed", "invoiced", "paid"]);
export const operationRole = pgEnum("operation_role", ["operation_manager", "operational"]);
export const compositionPresence = pgEnum("composition_presence", ["contains", "may_contain"]);
export const stockMovementReason = pgEnum("stock_movement_reason", ["received", "transferred", "sent", "returned", "damaged", "discarded", "counted"]);
export const identifierKind = pgEnum("identifier_kind", ["gtin", "sku", "vendor_code", "barcode"]);
export const proposalState = pgEnum("proposal_state", ["draft", "sent", "accepted", "rejected"]);

const stamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });
const qty = (name: string) => numeric(name, { precision: 14, scale: 3 });
const pct = (name: string) => numeric(name, { precision: 5, scale: 2 });

/** a catering business. It owns its clients, vendors, ontology, proposal templates, team and distribution rules */
export const ffCateringCompany = pgTable("catering_company", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the organization of type company that is this catering company. The organization is the seed's and is not changed */
  organizationId: text("organization_id").notNull().unique().references(() => uomOrganization.id),
  ...stamps(),
});

/** one term of the ontology of the catering company: a node of one tree */
export const ffOntologyTerm = pgTable("ontology_term", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the catering company this belongs to */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** other names the term is found by: aubergine and eggplant. For search. Not translations */
  aliases: text("aliases").array(),
  /** the term it is under. Empty for the root. The first level under the root is the kind of tree: ingredients (cod, carrot and under it baby carrot, E220), materials (wood, glass, plastic, paper), segments (miniatures and under it savoury, fried, croquettes), event type (coffee break, cocktail, catering). Food types and allergens are not terms: the food rules compute them. A screen shows one tree or several */
  parentId: uuid("parent_id").references((): AnyPgColumn => ffOntologyTerm.id),
  ...stamps(),
}, (t) => [uniqueIndex("ontology_term_catering_company_id_parent_id_name_unique").on(t.cateringCompanyId, t.parentId, t.name)]);

/** the rules of the catering company for one type of moment: what a guest gets at a coffee break, at a cocktail, at a catering. One set per type */
export const ffDistributionRuleSet = pgTable("distribution_rule_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** only the owner, or the role that manages templates, changes the rules */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  /** the term under "tipo de evento" this set is for */
  eventTypeTermId: uuid("event_type_term_id").notNull().references(() => ffOntologyTerm.id),
  /** the rules, as one typed document: a list of { selector: term ids, quantity, unit, for_every guests, splits }, where splits is a tree of { selector: term ids, percent, splits }. miniaturas 4 per guest, split salgadas 66 % / doces 34 %, under salgadas fritos 30 % / outras 70 %. A menu line matches a selector when it maps to all its terms. Siblings add to 100. At runtime only the branches that have menu lines in the moment count and their percents are renormalized; within a branch with no further split the lines share equally. The user can move any number or percent on the moment and the rest rebalances; only the numbers on the menu lines are saved. The API checks the term ids against the ontology on save */
  rules: jsonb("rules").notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("distribution_rule_set_catering_company_id_event_type_term_id_unique").on(t.cateringCompanyId, t.eventTypeTermId)]);

export const ffOntologyMapping = pgTable("ontology_mapping", {
  id: uuid("id").primaryKey().defaultRandom(),
  ontologyTermId: uuid("ontology_term_id").notNull().references(() => ffOntologyTerm.id),
  /** the table of what is mapped: component and menu_line_template for a segment, moment and proposal_template_moment for an event type. Always this way round: a thing has terms, never a term column on the thing. What a component is made of is not here: it is its composition */
  entityType: text("entity_type").notNull(),
  /** the row of that table */
  entityId: uuid("entity_id").notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("ontology_mapping_ontology_term_id_entity_type_entity_id_unique").on(t.ontologyTermId, t.entityType, t.entityId), index("ontology_mapping_entity_type_entity_id_idx").on(t.entityType, t.entityId)]);

export const ffVendor = pgTable("vendor", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the catering company this belongs to */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull().unique(),
  ...stamps(),
});

/** one atom of the catalog: anything an event needs, as it is bought. Its segment is a term mapped through ontology_mapping. What it is made of is its composition: ingredients for food, materials for material. Whether it is vegetarian or has gluten is computed by the food rules, never set by hand */
export const ffComponent = pgTable("component", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** the unit this component is counted in. What each unit measures (count, mass, volume) and how they convert is config, not data The component has no quantity: quantities are on the menu line component and on the vendor price. */
  unit: ffUnit("unit").notNull(),
  /** true: used many times, it comes back to the warehouse after the event (a plate, a table). false: consumed or thrown away (a skewer, a napkin, the food itself) */
  reusable: boolean("reusable"),
  /** true: its composition is the whole list, as on its label, and every food rule answers for it. false with composition lines: partial, the rules warn on what is listed (it has fish, it has milk) and answer unknown for the rest (no gluten, vegan). No composition lines: unknown, every rule answers unknown. Never safe by omission */
  compositionComplete: boolean("composition_complete").notNull().default(false),
  ...stamps(),
});

/** one article that fulfils a component, as it exists on the market, in one pack: Coca-Cola Zero, can of 33 cl. It belongs to no vendor: the same article is sold by many, and their prices for it compare directly. A component has many. Its codes are its identifiers */
export const ffArticle = pgTable("article", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  name: text("name").notNull(),
  /** what one article holds, in the unit below: 33 cl, 5 kg, 50 pieces. A pack is a quantity */
  quantity: qty("quantity").notNull(),
  /** pieces, g, kg, ml or l. It can differ from the unit of the component, within the same dimension */
  unit: ffUnit("unit").notNull(),
  /** a pack of another article: the case of 24 cans holds the can. A pack has its own identifiers. Empty for an article that is not a pack of another */
  holdsArticleId: uuid("holds_article_id").references((): AnyPgColumn => ffArticle.id),
  /** how many of that article it holds: 24. With it, the price of one can compares across a vendor selling cans and a vendor selling cases */
  holdsQuantity: qty("holds_quantity"),
  ...stamps(),
});

/** one code of an article. Every code is here, so a scan or a typed reference is one lookup and gives one article */
export const ffArticleIdentifier = pgTable("article_identifier", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull().references(() => ffArticle.id),
  /** gtin: the universal identifier (GS1), the same at every vendor, what a barcode scan usually gives; text brought to 14 digits with leading zeros. sku: our own code for the article, what it is, never where it is stored; every article has one, and it is the only code of an article with no GTIN. vendor_code: the reference of the article in one vendor's catalogue, what is typed to order it. barcode: a barcode that is not a GTIN, such as the one a supermarket prints on a weighed bag */
  kind: identifierKind("kind").notNull(),
  value: text("value").notNull(),
  /** the vendor whose code this is: filled for a vendor_code and for a vendor's own barcode, empty for a gtin and for our sku. A vendor's code is unique within that vendor; a gtin and a sku are unique overall. Two articles with different GTINs are never merged because their names look alike */
  vendorId: uuid("vendor_id").references(() => ffVendor.id),
  ...stamps(),
}, (t) => [uniqueIndex("article_identifier_kind_value_vendor_id_unique").on(t.kind, t.value, t.vendorId), index("article_identifier_article_id_idx").on(t.articleId)]);

/** a vendor sells an article at a price. The vendor's code for it is an identifier of the article */
export const ffArticleVendorPrice = pgTable("article_vendor_price", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull().references(() => ffArticle.id),
  vendorId: uuid("vendor_id").notNull().references(() => ffVendor.id),
  /** the article's page at the vendor */
  url: text("url"),
  /** for one article. The price of one unit is price divided by the article's quantity, not stored */
  price: money("price").notNull(),
  ...stamps(),
});

/** a place that receives deliveries, stores, prepares and dispatches */
export const ffOperatingCentre = pgTable("operating_centre", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  address: text("address"),
  ...stamps(),
});

/** how much of a component an operating centre holds */
export const ffStock = pgTable("stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  operatingCentreId: uuid("operating_centre_id").notNull().references(() => ffOperatingCentre.id),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** in the component's unit */
  quantity: qty("quantity").notNull(),
  countedAt: timestamp("counted_at", { withTimezone: true }).notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("stock_operating_centre_id_component_id_unique").on(t.operatingCentreId, t.componentId)]);

export const ffClient = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the catering company this belongs to */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** company | individual */
  kind: clientKind("kind").notNull(),
  /** the tax number (NIF) as written on the invoices. Empty when the client has none */
  taxId: text("tax_id"),
  ...stamps(),
});

export const ffEvent = pgTable("event", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the client the event is for */
  clientId: uuid("client_id").notNull().references(() => ffClient.id),
  /** when the event starts. The moments of its proposals happen between starts_at and ends_at */
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  /** when the event ends. The API refuses a moment that falls outside the event's starts_at and ends_at */
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  /** where the event is, as written: a town or a venue */
  place: text("place"),
  /** where the used material is washed after the event: in the kitchen of the client, or back at the warehouse */
  washing: washingPlace("washing"),
  /** what the client says they want to spend */
  budget: money("budget"),
  /** the operating centre that prepares and dispatches this event. Empty while there is only one */
  operatingCentreId: uuid("operating_centre_id").references(() => ffOperatingCentre.id),
  /** lead | awarded | closed | invoiced | paid. A lead has proposals; awarded when one is accepted; closed when the service was delivered; invoiced when its invoice was issued; paid when it was paid */
  stage: eventStage("stage").notNull(),
  ...stamps(),
});

export const ffProposal = pgTable("proposal", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  /** proposal 1, 2, 3 of the event */
  number: integer("number").notNull(),
  /** when the proposal was sent to the client. Empty while it is a draft. From then on the proposal, its moments, menu lines and operation cannot change */
  sentAt: timestamp("sent_at", { withTimezone: true }),
  /** draft | sent | accepted | rejected */
  state: proposalState("state").notNull(),
  ...stamps(),
});

/** one moment of a proposal: a coffee break, a cocktail, a catering. Its type is a term under "tipo de evento", through ontology_mapping like everything else; it picks the distribution rule set that fills the quantities of its menu lines. Its menu lines are what is served at it */
export const ffMoment = pgTable("moment", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => ffProposal.id),
  /** the day and the time the moment begins. It must fall inside the event's starts_at and ends_at: the API refuses a moment outside them */
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  /** the day and the time the moment ends: a moment can be on any day of the event */
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  /** the people to feed at this moment. It can be different from one moment to the next */
  guests: integer("guests").notNull(),
  position: integer("position").notNull(),
  ...stamps(),
});

/** a menu line kept by the system: a thing that is sold, such as a set of savory miniatures or a main dish. Adding it to a moment copies it as a menu line */
export const ffMenuLineTemplate = pgTable("menu_line_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** what the client pays for one of the line, in the unit of the line. Empty when not priced yet. Copied to the menu line when the template is added to a moment */
  price: money("price"),
  /** the VAT of the line as a percentage: 13 for food, 23 for drinks with alcohol. Copied with the price */
  vatRate: pct("vat_rate"),
  /** free words the author puts on it, separated by commas: Christmas, hipster, summer. Outside the ontology: nothing computes with them, they serve search and filtering. Only the menu line template has tags */
  tags: text("tags"),
  ...stamps(),
});

export const ffMenuLine = pgTable("menu_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the moment of a proposal it is in */
  momentId: uuid("moment_id").notNull().references(() => ffMoment.id),
  /** the menu line template it was copied from. Empty for a line made by hand. The line keeps its own price, quantity and components, so a later change of the template does not change it. The link says where it came from and reaches the template's tags and segments */
  menuLineTemplateId: uuid("menu_line_template_id").references(() => ffMenuLineTemplate.id),
  /** per guest, in the unit below: pieces of miniatures, grams of a main dish, litres of a drink. Filled by the distribution rules of the moment's type when a menu line template is added to a moment, and it can be changed for this moment. The menu line template has no quantity. At runtime: guests of the moment x this quantity = what is served. The purchase list and the logistics are computed from it, not stored */
  quantity: qty("quantity").notNull(),
  /** piece, g, ml or l, as in the distribution rule that filled it */
  unit: ffUnit("unit").notNull(),
  /** what the client pays for one of the line. Copied from the menu line template when added, can be changed for this proposal. Fixed once the proposal is sent. The component has no price: selling is by the line */
  price: money("price"),
  /** copied with the price, can be changed for this proposal */
  vatRate: pct("vat_rate"),
  /** what the author adds for this line of this proposal, in their words: the client wants Coca-Cola and Fanta. Shown on the proposal */
  note: text("note"),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffMenuLineComponent = pgTable("menu_line_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineId: uuid("menu_line_id").notNull().references(() => ffMenuLine.id),
  /** a component: what is served, or what it takes to serve it */
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** how many of the component go in one of the menu line, in the component's unit. It is a share, not a total: the total is computed at runtime as guests of the moment x the quantity of the menu line x this quantity, and it feeds the purchase list. The component itself only has its unit */
  quantity: qty("quantity").notNull(),
  /** of how many of the line: quantity 1 for_every 40 is one plate for every 40 croquetes */
  forEvery: qty("for_every").notNull().default("1"),
  ...stamps(),
});

/** a template belongs to the system: nothing of a proposal points to it. A proposal made from it gets a copy of its moments and their menu lines */
export const ffProposalTemplate = pgTable("proposal_template", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the catering company this belongs to */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** the picture of the template, a file of the project's Files, for the visual menu shown to the client */
  uploadId: uuid("upload_id"),
  ...stamps(),
});

export const ffMenuLineTemplateComponent = pgTable("menu_line_template_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineTemplateId: uuid("menu_line_template_id").notNull().references(() => ffMenuLineTemplate.id),
  /** a component: what is served, or what it takes to serve it */
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** how many of the component, in the component's unit */
  quantity: qty("quantity").notNull(),
  /** of how many of the line: quantity 1 for_every 40 is one plate for every 40 croquetes The same pair is copied with the line. */
  forEvery: qty("for_every").notNull().default("1"),
  ...stamps(),
});

/** one moment of a proposal template. Its type is a term under "tipo de evento", through ontology_mapping */
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

export const ffTeamMember = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the catering company this belongs to */
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  name: text("name").notNull(),
  /** the user this person signs in as. The user is the seed's, and it is not changed: the team member points to it */
  userId: text("user_id").notNull().unique().references(() => uomUser.id),
  ...stamps(),
});

export const ffEventMember = pgTable("event_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  /** the event manager: manages everything of the event */
  teamMemberId: uuid("team_member_id").notNull().references(() => ffTeamMember.id),
  ...stamps(),
});

export const ffOperation = pgTable("operation", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** every proposal has an operation: what it takes to do it. The accepted proposal's operation is the one carried out */
  proposalId: uuid("proposal_id").notNull().unique().references(() => ffProposal.id),
  ...stamps(),
});

export const ffStockAllocation = pgTable("stock_allocation", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  /** the stock it is reserved from: a component at an operating centre */
  stockId: uuid("stock_id").notNull().references(() => ffStock.id),
  /** how much of that stock is reserved for this operation, in the component's unit. Made when the event is awarded, so two events one after the other do not count the same stock */
  quantity: qty("quantity").notNull(),
  ...stamps(),
});

/** an article bought from a vendor for an operating centre: 5 cases of 24 cans from Makro. What has to be bought is not stored: the shopping list is computed, in components, from what the awarded events need minus what the centre holds minus what is already reserved. A purchase is in articles and can cover several events, so it points to no operation. Nothing is marked as bought: when the goods arrive, that is a stock movement with reason received, pointing to this purchase */
export const ffPurchase = pgTable("article_purchase", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull().references(() => ffArticle.id),
  vendorId: uuid("vendor_id").notNull().references(() => ffVendor.id),
  /** the centre it is bought for, where the delivery arrives. Empty while there is only one */
  operatingCentreId: uuid("operating_centre_id").references(() => ffOperatingCentre.id),
  /** how many of the article: 5 cases */
  quantity: qty("quantity").notNull(),
  /** what one article cost in this purchase */
  price: money("price").notNull(),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull(),
  ...stamps(),
});

export const ffLogisticsComponent = pgTable("logistics_component", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  /** the material: a table, a plate, a cup */
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** how many of it the operation needs, in the component's unit. Whether they are free on the dates of the event, or already in another event, is worked out at runtime */
  quantity: qty("quantity").notNull(),
  ...stamps(),
});

/** money the catering company spends: a purchase, the staff of a day, fuel and tolls, or a cost of the business with no event. What it is for is the links: a purchase ties it to what was bought; an operation ties it to an event (staff, travel); neither is a cost of the business */
export const ffExpense = pgTable("expense", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  /** the operation this expense belongs to, when it belongs to one. Empty for a cost of the business */
  operationId: uuid("operation_id").references(() => ffOperation.id),
  /** the purchase this expense pays, when it pays one */
  purchaseId: uuid("purchase_id").references(() => ffPurchase.id),
  /** what was paid, in the author's words: 2 kg camarão, staff 20 Oct, portagens Lisboa */
  description: text("description").notNull(),
  /** what was paid, VAT included */
  amount: money("amount").notNull(),
  /** the VAT part of the amount, when known */
  vat: money("vat"),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  ...stamps(),
});

export const ffOperationMember = pgTable("operation_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  /** empty while the proposal is being costed. Filled once the event is awarded */
  teamMemberId: uuid("team_member_id").references(() => ffTeamMember.id),
  /** operation_manager sees everyone and everything of the operation. operational sees what is ruled later */
  role: operationRole("role").notNull(),
  hours: qty("hours").notNull(),
  /** the price of this person's time, part of the proposal's cost */
  hourlyRate: money("hourly_rate").notNull(),
  ...stamps(),
});

/** something charged in the proposal that is not a moment or the operation: transport, rental, an extra */
export const ffProposalAdHocLine = pgTable("proposal_ad_hoc_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => ffProposal.id),
  /** what is charged, in the author's words */
  description: text("description").notNull(),
  quantity: qty("quantity").notNull(),
  /** for one of the quantity. Typed for this proposal, fixed once the proposal is sent */
  price: money("price").notNull(),
  /** the VAT of this line as a percentage */
  vatRate: pct("vat_rate").notNull(),
  position: integer("position").notNull(),
  ...stamps(),
});

export const ffInvoice = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the event it is for. What the invoice charges is the accepted proposal of the event, not stored again. An event can have several invoices, for example one on award and one on the day */
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  /** the number of the invoice, as issued: FA2025/17 */
  number: text("number").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  /** the due date, from the payment terms */
  dueAt: timestamp("due_at", { withTimezone: true }),
  /** as written on the invoice: 30 days, 50% on award and 50% on the day */
  paymentTerms: text("payment_terms"),
  /** the amount before VAT, as issued */
  net: money("net").notNull(),
  /** the VAT, as issued */
  vat: money("vat").notNull(),
  /** what the client pays: net plus VAT, as issued. The invoice is a fiscal document: these amounts do not follow later changes */
  total: money("total").notNull(),
  /** when the invoice was cancelled, for example issued by mistake. Empty while it stands. A cancelled invoice keeps its number and is not charged */
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  ...stamps(),
});

export const ffCreditNote = pgTable("credit_note", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the invoice it credits */
  invoiceId: uuid("invoice_id").notNull().references(() => ffInvoice.id),
  /** the number of the credit note, as issued: NC2025/2 */
  number: text("number").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  /** the amount credited before VAT, as issued */
  net: money("net").notNull(),
  vat: money("vat").notNull(),
  /** what is credited to the client, as issued */
  total: money("total").notNull(),
  /** why it was issued, in the author's words */
  reason: text("reason"),
  ...stamps(),
});

export const ffPayment = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => ffInvoice.id),
  /** the day the money arrived */
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  /** what arrived. An invoice can be paid in several payments */
  amount: money("amount").notNull(),
  ...stamps(),
});

/** one line of what a component is made of: an ingredient for food (cod, E220), a material for material (wood, glass). The composition belongs to the component, whoever sells it and in whatever pack. A raw component has one line (the component baby carrot has the ingredient baby carrot); a bought dish has many. Names only, never an amount. Nothing is stored on menu lines: what a menu line has is computed from its components */
export const ffComponentComposition = pgTable("component_composition", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** a term of the ingredients tree or of the materials tree, at any depth: carrot, or baby carrot. A term is everything above it, so baby carrot is a carrot and a vegetable without saying so */
  ontologyTermId: uuid("ontology_term_id").notNull().references(() => ffOntologyTerm.id),
  /** contains: it is in the composition. may_contain: the label warns of traces */
  presence: compositionPresence("presence").notNull(),
  /** where the line came from: the label, the technical sheet of the product, the vendor */
  source: text("source"),
  ...stamps(),
}, (t) => [uniqueIndex("component_composition_component_id_ontology_term_id_unique").on(t.componentId, t.ontologyTermId)]);

/** something a component has a measured amount of: a nutrient (carbs, sugar, fat, protein, salt) or a chemical (alcohol, caffeine, sulphites). One list for all. A new one is a new row */
export const ffSubstance = pgTable("substance", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  ...stamps(),
});

/** how much of a substance a component has, as its label states: 0 g of sugar for every 100 ml of Coca-Cola Zero, 21 g of carbs for every 100 g of croquete. Can stay empty: the rules that set a limit answer unknown without it */
export const ffComponentValue = pgTable("component_value", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentId: uuid("component_id").notNull().references(() => ffComponent.id),
  /** which substance this row states */
  substanceId: uuid("substance_id").notNull().references(() => ffSubstance.id),
  quantity: qty("quantity").notNull(),
  unit: ffUnit("unit").notNull(),
  /** of how much of the component: 100 */
  forEveryQuantity: qty("for_every_quantity").notNull(),
  /** g for a solid, ml for a drink, piece for an egg */
  forEveryUnit: ffUnit("for_every_unit").notNull(),
  ...stamps(),
}, (t) => [uniqueIndex("component_value_component_id_substance_id_unique").on(t.componentId, t.substanceId)]);

/** the food rules of the catering company: what makes something vegan, vegetarian, keto, free of seafood, and which allergens it has */
export const ffFoodRuleSet = pgTable("food_rule_set", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().unique().references(() => ffCateringCompany.id),
  /** one typed document keyed by the name of what the rule defines, a food type or an allergen (vegan, keto, gluten). These are not terms of the ontology: { excludes: [ { node, except: [nodes] } ], includes: [ { node, except: [nodes] } ], limits: [ { substance, max or min: { quantity, unit }, for_every: { quantity, unit } } ] }. A node is a term of the ingredients tree, leaf or branch, and stands for everything under it; an except only names nodes inside its own node. excludes: the term holds when no ingredient is under those nodes. includes: the term is present when an ingredient is under those nodes. limits: a value summed over what is served, for every guest or for every amount of food. A component with unknown composition makes the answer unknown */
  rules: jsonb("rules").notNull(),
  ...stamps(),
});

/** a procedure, written to be followed: how to receive a delivery, assemble an espetada de croquete, pack a tray, load the van, handle what returns. Receiving, preparation, packing, loading, service and returns are guidelines, not tables of tasks. The phase it belongs to is its term in the ontology */
export const ffGuideline = pgTable("guideline", {
  id: uuid("id").primaryKey().defaultRandom(),
  cateringCompanyId: uuid("catering_company_id").notNull().references(() => ffCateringCompany.id),
  title: text("title").notNull(),
  /** the steps, in order, with their pictures */
  body: text("body").notNull(),
  /** the table of the thing the guideline is about, when it is about one: component, menu_line_template, operating_centre. Empty for a general procedure */
  entityType: text("entity_type"),
  /** the row of that table */
  entityId: uuid("entity_id"),
  ...stamps(),
});

/** something moved: from one operating centre to another, from a centre to an event, or from an event back to a centre. What goes out to a party and what comes back from it (drinks not opened, plates, what was not served) are two movements. What broke or was lost is the difference, or a movement with that reason */
export const ffStockMovement = pgTable("stock_movement", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the table of what moved: component (a crate of water, 40 plates) or menu_line (20 trays of an assembled menu line going to the party) */
  entityType: text("entity_type").notNull(),
  /** the row of that table */
  entityId: uuid("entity_id").notNull(),
  /** how much moved, in the unit of the component or of the menu line */
  quantity: qty("quantity").notNull(),
  /** the centre it left. Empty when it comes from a vendor or back from an event */
  fromOperatingCentreId: uuid("from_operating_centre_id").references(() => ffOperatingCentre.id),
  /** the centre it arrived at. Empty when it goes to an event or is discarded */
  toOperatingCentreId: uuid("to_operating_centre_id").references(() => ffOperatingCentre.id),
  /** the operation it went to or came back from. Empty for a movement between centres or a delivery from a vendor */
  operationId: uuid("operation_id").references(() => ffOperation.id),
  /** the purchase that arrived, for a movement with reason received */
  purchaseId: uuid("purchase_id").references(() => ffPurchase.id),
  reason: stockMovementReason("reason").notNull(),
  /** the explanation, when the reason asks for one: damaged, discarded */
  note: text("note"),
  /** who recorded it */
  userId: text("user_id").notNull().references(() => uomUser.id),
  movedAt: timestamp("moved_at", { withTimezone: true }).notNull(),
  ...stamps(),
}, (t) => [index("stock_movement_entity_type_entity_id_idx").on(t.entityType, t.entityId)]);

/** a person asked to take a slot of an operation */
export const ffOperationMemberInvitation = pgTable("operation_member_invitation", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the slot: a role, its hours and its rate */
  operationMemberId: uuid("operation_member_id").notNull().references(() => ffOperationMember.id),
  /** the person asked */
  teamMemberId: uuid("team_member_id").notNull().references(() => ffTeamMember.id),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  /** empty until answered */
  accepted: boolean("accepted"),
  /** the last time the person confirmed again before the event */
  reconfirmedAt: timestamp("reconfirmed_at", { withTimezone: true }),
  ...stamps(),
});

/** a share of the sale of an event owed to who brought it. What is paid is an expense */
export const ffCommissionAgreement = pgTable("commission_agreement", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  beneficiary: text("beneficiary").notNull(),
  percent: pct("percent").notNull(),
  ...stamps(),
});
