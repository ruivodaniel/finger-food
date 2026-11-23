/** inner_capsule — one version: points at one row of the entity's own table. The open one on a branch is its head;
 * seq is its position on the branch. */
import { sql } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { branch } from "./branch.model";
import { outerCapsule } from "./outer-capsule.model";

export const originKindEnum = pgEnum("origin_kind", ["first", "continuation", "branch", "merge"]);
export const authorTypeEnum = pgEnum("author_type", ["user", "agent", "deterministic"]);

export const innerCapsule = pgTable(
  "inner_capsule",
  {
    id: text("id").primaryKey(),
    outerCapsuleId: text("outer_capsule_id").notNull().references(() => outerCapsule.id),
    branchId: text("branch_id").notNull().references(() => branch.id),
    entityType: text("entity_type").notNull(),
    /** the row of the entity's table this version is; polymorphic, so no foreign key */
    entityRowId: text("entity_row_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    originKind: originKindEnum("origin_kind").notNull(),
    authorId: text("author_id").notNull(),
    authorType: authorTypeEnum("author_type").notNull(),
    /** who asked the author to act: an agent acts on behalf of a user */
    instructedById: text("instructed_by_id"),
    /** an agent author: the workflow it ran in */
    authorWorkflowId: text("author_workflow_id"),
    /** an agent author: the model that made the version */
    authorModelVersion: text("author_model_version"),
    /** universal to every versioned entity, from its entry in the versioned list */
    title: text("title"),
    /** unique per entity type among the heads of main */
    slug: text("slug"),
    isMain: boolean("is_main").notNull(),
    /** the versions it was made from: none for first, one for continuation and branch, several for merge */
    sourceVersionIds: text("source_version_ids").array().notNull().default(sql`'{}'::text[]`),
    intentWhat: text("intent_what"),
    intentWhy: text("intent_why"),
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

export type InnerCapsuleSelect = typeof innerCapsule.$inferSelect;
