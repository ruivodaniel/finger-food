/** outer_capsule — the identity of a versioned thing. Branches, versions and releases point at its id; the API and the
 * entity's rows use its entity_id. Alive while valid_to is null. */
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const outerCapsule = pgTable("outer_capsule", {
  id: text("id").primaryKey(),
  entityId: text("entity_id").notNull().unique(),
  /** which entity of the versioned list it is */
  entityType: text("entity_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validTo: timestamp("valid_to", { withTimezone: true }),
});

export type OuterCapsuleSelect = typeof outerCapsule.$inferSelect;
