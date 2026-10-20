/**
 * User domain schema — the app-side account row, its profile, and its
 * contact addresses.
 *
 * Credentials, identifiers, and verification state live in the identity
 * provider; `identityId` is the join key. The profile is the store for
 * config-driven profile-data obligations (`data` holds fields the DSL
 * demands beyond the fixed columns). Contacts are where the product
 * REACHES the user — plain rows with no login power (see
 * docs/identifiers.md); the first login identifier seeds the default one
 * at birth.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { UserContact } from "../../shared/types/domain";

export const uomUser = pgTable("user", {
  id: text("id").primaryKey(),
  /** Identity-provider identity id (Kratos identity UUID). Globally unique
   * forever — Kratos never regenerates an identity id, so this stays a PLAIN
   * unique constraint, not one scoped to live rows. */
  identityId: text("identity_id").notNull().unique(),
  status: text("status", { enum: ["active", "disabled"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  /** Soft-delete marker — null means live; set on delete (UOM8).
   * UOM8 open question: what happens when a soft-deleted identity comes back
   * (revive vs stay blocked) is undecided — `user.delete` has no caller until
   * the ban/delete lifecycle lands, so the case is unreachable today. */
  deletedAt: timestamp("deleted_at"),
});
export type UomUserSelect = typeof uomUser.$inferSelect;

export const uomUserProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => uomUser.id, { onDelete: "cascade" }),
  name: text("name"),
  image: text("image"),
  /** Config-driven profile fields (e.g. `age`) keyed by DSL data-field name. */
  data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
  updatedAt: timestamp("updated_at").notNull(),
});
export type UomUserProfileSelect = typeof uomUserProfile.$inferSelect;

export type UserContactPayload = UserContact;

export const uomUserContact = pgTable(
  "user_contacts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => uomUser.id, { onDelete: "cascade" }),
    contact: jsonb("contact").$type<UserContactPayload>().notNull(),
    /** The address lists show — at most one per user, seeded at birth. */
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [index("user_contacts_user_idx").on(table.userId)],
);
export type UomUserContactSelect = typeof uomUserContact.$inferSelect;

export const uomUserRelations = relations(uomUser, ({ one, many }) => ({
  profile: one(uomUserProfile, {
    fields: [uomUser.id],
    references: [uomUserProfile.userId],
  }),
  contacts: many(uomUserContact),
}));

export const uomUserContactRelations = relations(uomUserContact, ({ one }) => ({
  user: one(uomUser, {
    fields: [uomUserContact.userId],
    references: [uomUser.id],
  }),
}));
