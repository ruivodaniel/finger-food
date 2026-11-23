/** version_delta — what changed between two versions, as the entity's delta (or one entry per changed column) says. */
import { jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { FieldDelta } from "@libs/versioning";
import { innerCapsule } from "./inner-capsule.model";

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

export type VersionDeltaSelect = typeof versionDelta.$inferSelect;
