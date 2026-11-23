/**
 * meteor — a meteor a company keeps. `organization_id` is the scope's target
 * for company members; `status` says what the public door serves.
 */

import { date, index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const meteorStatus = pgEnum("meteor_status", ["draft", "published"]);

export const meteor = pgTable(
  "meteor",
  {
    id: text("id").primaryKey(),
    /** The company that keeps it — the rules' target. */
    organizationId: text("organization_id").notNull(),
    /** The member who added it — a fact for the UI, not a rule. */
    createdBy: text("created_by").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    diameterKm: numeric("diameter_km"),
    discoveredAt: date("discovered_at"),
    status: meteorStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("meteor_org_idx").on(table.organizationId),
    index("meteor_status_idx").on(table.status),
  ],
);

export type MeteorSelect = typeof meteor.$inferSelect;
export type MeteorInsert = typeof meteor.$inferInsert;
