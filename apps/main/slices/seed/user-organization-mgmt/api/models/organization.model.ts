/**
 * Organization schema — a tenant of a configured org type.
 *
 * `type` is org-lifecycle vocabulary (`system_admin` | `platform_admin` |
 * `company` | `musical_project` | …): the module treats it as opaque and the lifecycle config
 * decides what each type may do. Singleton-ness is a config policy enforced
 * by the service, never DDL.
 */

import { jsonb, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const uomOrganization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    /** Org-lifecycle org type id — opaque to the module. */
    type: text("type").notNull(),
    name: text("name").notNull(),
    logo: text("logo"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    /** Soft-delete marker — null means live; set on delete (UOM8). */
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("organization_type_idx").on(table.type)],
);
export type UomOrganizationSelect = typeof uomOrganization.$inferSelect;
