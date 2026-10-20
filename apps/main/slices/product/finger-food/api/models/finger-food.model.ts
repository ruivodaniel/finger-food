/**
 * FINGER FOOD domain schema — generated from erd/design.dbml (the designed ERD). Edit the DBML, then regenerate.
 * Every table also has created_at and updated_at. Money is numeric(12,2), quantities numeric(14,3), VAT numeric(5,2).
 */

import { uomUser } from "@modules/user-organization-mgmt/models";
import { type AnyPgColumn, boolean, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const menuSegment = pgEnum("menu_segment", ["savory_miniature", "sweet_miniature", "starter", "main_dish", "dessert"]);
export const unitDimension = pgEnum("unit_dimension", ["count", "mass", "volume"]);
export const serviceType = pgEnum("service_type", ["coffee_break", "lunch", "dinner"]);
export const clientKind = pgEnum("client_kind", ["company", "individual"]);
export const eventStage = pgEnum("event_stage", ["lead", "awarded"]);
export const operationRole = pgEnum("operation_role", ["operation_manager", "operational"]);
export const proposalState = pgEnum("proposal_state", ["draft", "sent", "accepted", "rejected"]);

export const ffUnit = pgTable("unit", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the unit a quantity is in: piece, box, tray, g, kg, ml, l */
  name: text("name").notNull().unique(),
  /** what it measures: count (pieces, boxes), mass (grams, kilos), volume (millilitres, litres). Only units of the same dimension convert into each other */
  dimension: unitDimension("dimension").notNull(),
  /** how many of the base unit one of this unit is. The base is the piece for count, the gram for mass, the millilitre for volume: kg is 1000, l is 1000, a box of 12 is 12, piece is 1. Metric only */
  baseFactor: numeric("base_factor", { precision: 14, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffItemCategory = pgTable("item_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** the category it is part of. Empty for the top of the tree: raw food, prepared food, utility */
  parentId: uuid("parent_id").references((): AnyPgColumn => ffItemCategory.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffVendor = pgTable("vendor", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffVendorPrice = pgTable("vendor_price", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id").notNull().references(() => ffVendor.id),
  itemId: uuid("item_id").notNull().references(() => ffItem.id),
  /** the price is for this many of the unit below: 10 pieces, 5 kg, 2 l */
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  /** the unit the vendor sells in. It can differ from the unit of the item: a box of 12 for an item counted by the piece. It must be of the same dimension as the item */
  unitId: uuid("unit_id").notNull().references(() => ffUnit.id),
  /** for that quantity. The price of one unit is price divided by quantity, not stored */
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffItem = pgTable("item", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** the most specific category of the tree the item belongs to */
  categoryId: uuid("category_id").notNull().references(() => ffItemCategory.id),
  /** the unit this item is counted in */
  unitId: uuid("unit_id").notNull().references(() => ffUnit.id),
  /** what the company charges for one unit of this item. Empty for what is not sold. A proposal copies it when the item is added and may change it for that proposal, so a change here never reaches a proposal already made */
  price: numeric("price", { precision: 12, scale: 2 }),
  /** the VAT of this item as a percentage: 13 for food, 23 for beer. Empty for what is not sold */
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  /** utility only (under the utility category). true: comes back to the warehouse after the event. false: thrown away. Empty for food */
  reusable: boolean("reusable"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffComponent = pgTable("component", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the item that is assembled */
  assemblyId: uuid("assembly_id").notNull().references(() => ffItem.id),
  /** the item that goes into it: raw food, prepared food or a utility */
  partId: uuid("part_id").notNull().references(() => ffItem.id),
  /** how many of the part, in the part's unit, for one of the assembly */
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffStock = pgTable("stock", {
  /** one row per item kept in the warehouse */
  itemId: uuid("item_id").primaryKey().defaultRandom().references(() => ffItem.id),
  /** in the item's unit */
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  countedAt: timestamp("counted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffMenuLine = pgTable("menu_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the moment of a proposal it is in. A copy: it points to no menu line template */
  momentId: uuid("moment_id").notNull().references(() => ffMoment.id),
  /** what the line is: savory miniatures, sweet miniatures, starters, main dishes, desserts */
  segment: menuSegment("segment").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffMenuLineItem = pgTable("menu_line_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineId: uuid("menu_line_id").notNull().references(() => ffMenuLine.id),
  /** a prepared item */
  itemId: uuid("item_id").notNull().references(() => ffItem.id),
  /** how many of the item, in the item's unit */
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  /** copied from the item when it is added to the proposal, and it can be changed for this proposal. Fixed once the proposal is sent */
  price: numeric("price", { precision: 12, scale: 2 }),
  /** copied from the item together with the price */
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffClient = pgTable("client", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** company | individual */
  kind: clientKind("kind").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffEvent = pgTable("event", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the client the event is for */
  clientId: uuid("client_id").notNull().references(() => ffClient.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  /** what the client says they want to spend */
  budget: numeric("budget", { precision: 12, scale: 2 }),
  /** lead | awarded */
  stage: eventStage("stage").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffProposalTemplate = pgTable("proposal_template", {
  /** a template belongs to the system: nothing of a proposal points to it. A proposal made from it gets a copy of its moments and their menu lines */
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** the picture of the template, a file of the project's Files, for the visual menu shown to the client */
  uploadId: uuid("upload_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffMenuLineTemplate = pgTable("menu_line_template", {
  /** a menu line kept by the system: an assembled thing that is sold, such as a set of savory miniatures or a main dish. Adding it to a moment copies it as a menu line */
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  /** how the line is categorized */
  segment: menuSegment("segment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffMenuLineTemplateItem = pgTable("menu_line_template_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuLineTemplateId: uuid("menu_line_template_id").notNull().references(() => ffMenuLineTemplate.id),
  /** a prepared item of the line */
  itemId: uuid("item_id").notNull().references(() => ffItem.id),
  /** how many of the item, in the item's unit */
  quantity: numeric("quantity", { precision: 14, scale: 3 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffProposalTemplateMoment = pgTable("proposal_template_moment", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalTemplateId: uuid("proposal_template_id").notNull().references(() => ffProposalTemplate.id),
  serviceType: serviceType("service_type").notNull(),
  /** coffee break: 4 miniatures per guest, divided among the items of the moment */
  unitsPerGuest: integer("units_per_guest"),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffProposalTemplateMomentLine = pgTable("proposal_template_moment_line", {
  id: uuid("id").primaryKey().defaultRandom(),
  proposalTemplateMomentId: uuid("proposal_template_moment_id").notNull().references(() => ffProposalTemplateMoment.id),
  menuLineTemplateId: uuid("menu_line_template_id").notNull().references(() => ffMenuLineTemplate.id),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffMoment = pgTable("moment", {
  /** one moment of a proposal: a coffee break, a lunch, a cocktail. Its menu lines are what is served at it */
  id: uuid("id").primaryKey().defaultRandom(),
  proposalId: uuid("proposal_id").notNull().references(() => ffProposal.id),
  serviceType: serviceType("service_type").notNull(),
  /** coffee break: 4 miniatures per guest, divided among the items of the moment */
  unitsPerGuest: integer("units_per_guest"),
  /** the people to feed at this moment. It can be different from one moment to the next */
  guests: integer("guests").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffTeamMember = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** the user this person signs in as. The user is the seed's, and it is not changed: the team member points to it */
  userId: text("user_id").notNull().unique().references(() => uomUser.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffEventMember = pgTable("event_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  /** the event manager: manages everything of the event */
  teamMemberId: uuid("team_member_id").notNull().references(() => ffTeamMember.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffOperation = pgTable("operation", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** every proposal has an operation: what it takes to do it. The accepted proposal's operation is the one carried out */
  proposalId: uuid("proposal_id").notNull().unique().references(() => ffProposal.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffOperationMember = pgTable("operation_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationId: uuid("operation_id").notNull().references(() => ffOperation.id),
  /** empty while the proposal is being costed. Filled once the event is awarded */
  teamMemberId: uuid("team_member_id").references(() => ffTeamMember.id),
  /** operation_manager sees everyone and everything of the operation. operational sees what is ruled later */
  role: operationRole("role").notNull(),
  hours: numeric("hours", { precision: 14, scale: 3 }).notNull(),
  /** the price of this person's time, part of the proposal's cost */
  hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ffInvoice = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** the event it is for. An event can have several invoices, for example one on award and one on the day. It does not depend on a proposal or an operation */
  eventId: uuid("event_id").notNull().references(() => ffEvent.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
