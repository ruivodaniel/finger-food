/** branch — a line of versions of one identity. Every identity starts with "main". valid_to set: archived. */
import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { outerCapsule } from "./outer-capsule.model";

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

export type BranchSelect = typeof branch.$inferSelect;
