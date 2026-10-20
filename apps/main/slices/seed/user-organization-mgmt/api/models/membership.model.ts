/**
 * Membership schema — one row per (organization, user) holding the member's
 * scoped role names directly (`roles: text[]`). The row maps 1:1 to the
 * gate's `MembershipFacts { orgType, roles }` — no translation layer.
 */

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { uomOrganization } from "./organization.model";
import { uomUser } from "./user.model";

export const uomMembership = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => uomOrganization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => uomUser.id, { onDelete: "cascade" }),
    /** Scoped role names (access-control vocabulary — opaque to the module). */
    roles: text("roles").array().notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    /** Soft-delete marker — null means live; set on member removal (UOM8). */
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    // Partial: one LIVE membership per (org, user); soft-deleted rows stay as
    // history, and re-adding a removed member inserts a fresh live row.
    uniqueIndex("member_org_user_idx")
      .on(table.organizationId, table.userId)
      .where(sql`${table.deletedAt} is null`),
    index("member_user_idx").on(table.userId),
  ],
);
export type UomMembershipSelect = typeof uomMembership.$inferSelect;
