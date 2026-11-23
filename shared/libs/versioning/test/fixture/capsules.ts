// The capsule tables the tests inject, as drizzle definitions. The library
// defines no table: the versioning slice's models hold the real ones (step 5),
// and any tables of the CapsuleTables shape work: here every id is text, the
// slice's are uuid and its origin and author types enums.
import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { CapsuleTables, FieldDelta } from "../../src/index";

/** The identity: branches and versions point at its id, the API talks about its entity id. Alive while valid_to is null. */
export const outerCapsule = pgTable("outer_capsule", {
  id: text("id").primaryKey(),
  entityId: text("entity_id").notNull().unique(),
  entityType: text("entity_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validTo: timestamp("valid_to", { withTimezone: true }),
});

/** A line of versions of one identity. Every identity starts with "main". */
export const branch = pgTable(
  "branch",
  {
    id: text("id").primaryKey(),
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
  },
  (table) => [uniqueIndex("branch_name_per_outer").on(table.outerCapsuleId, table.name)],
);

/** One version: points at one row of the entity table. The head of a branch
 * is the one with valid_to null; at most one per branch (partial unique). */
export const innerCapsule = pgTable(
  "inner_capsule",
  {
    id: text("id").primaryKey(),
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.id),
    branchId: text("branch_id").notNull().references(() => branch.id),
    entityType: text("entity_type").notNull(),
    entityRowId: text("entity_row_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    /** first | continuation | branch | merge */
    originKind: text("origin_kind").notNull(),
    authorId: text("author_id").notNull(),
    /** user | agent | deterministic */
    authorType: text("author_type").notNull(),
    instructedById: text("instructed_by_id"),
    authorWorkflowId: text("author_workflow_id"),
    authorModelVersion: text("author_model_version"),
    title: text("title"),
    slug: text("slug"),
    isMain: boolean("is_main").notNull(),
    sourceVersionIds: text("source_version_ids").array().notNull().default(sql`'{}'::text[]`),
    intentWhat: text("intent_what"),
    intentWhy: text("intent_why"),
    /** its position on its branch, from 0; set by the save that read the head */
    seq: integer("seq").notNull(),
  },
  (table) => [
    uniqueIndex("one_head_per_branch").on(table.branchId).where(sql`${table.validTo} is null`),
    uniqueIndex("seq_per_branch").on(table.branchId, table.seq),
    uniqueIndex("slug_among_main_heads").on(table.entityType, table.slug).where(sql`${table.validTo} is null and ${table.isMain} and ${table.slug} is not null`),
    index("inner_capsule_by_row").on(table.entityType, table.entityRowId),
    index("inner_capsule_by_outer").on(table.outerCapsuleId, table.branchId, table.validFrom),
  ],
);

/** What changed between two versions: [{ field, from, to }]. */
export const versionDelta = pgTable(
  "version_delta",
  {
    id: text("id").primaryKey(),
    fromInnerCapsuleId: text("from_inner_capsule_id").notNull().references(() => innerCapsule.id),
    toInnerCapsuleId: text("to_inner_capsule_id").notNull().references(() => innerCapsule.id),
    entityType: text("entity_type").notNull(),
    fields: jsonb("fields").$type<FieldDelta[]>().notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("one_delta_per_pair").on(table.fromInnerCapsuleId, table.toInnerCapsuleId)],
);

/** Injected into createVersioning: the shape the library asks for, checked here. */
export const capsuleTables = { outerCapsule, branch, innerCapsule, versionDelta } satisfies CapsuleTables;
