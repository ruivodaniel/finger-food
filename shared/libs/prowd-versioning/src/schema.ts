// The capsule tables, as drizzle definitions. The library owns no migration:
// the app re-exports these from its models so drizzle-kit migrates them with
// the rest, and injects them (or its own, same shape) into createVersioning.
// Every id is text: the app's ids are text, and an outer id travels as the
// API's id.
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/** The identity: the id the API talks about. Alive while valid_to is null. */
export const outerCapsule = pgTable("outer_capsule", {
  entityId: text("entity_id").primaryKey(),
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
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.entityId),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
  },
  (t) => [uniqueIndex("branch_name_per_outer").on(t.outerCapsuleId, t.name)],
);

/** One version: points at one row of the entity table. The head of a branch
 * is the one with valid_to null; at most one per branch (partial unique). */
export const innerCapsule = pgTable(
  "inner_capsule",
  {
    id: text("id").primaryKey(),
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.entityId),
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
    isMain: boolean("is_main").notNull(),
    sourceVersionIds: text("source_version_ids").array().notNull().default(sql`'{}'::text[]`),
  },
  (t) => [
    uniqueIndex("one_head_per_branch").on(t.branchId).where(sql`${t.validTo} is null`),
    index("inner_capsule_by_row").on(t.entityType, t.entityRowId),
    index("inner_capsule_by_outer").on(t.outerCapsuleId, t.branchId, t.validFrom),
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
  (t) => [uniqueIndex("one_delta_per_pair").on(t.fromInnerCapsuleId, t.toInnerCapsuleId)],
);

export type FieldDelta = { field: string; from: unknown; to: unknown };
export const capsuleTables = { outerCapsule, branch, innerCapsule, versionDelta };
export type CapsuleTables = typeof capsuleTables;
