/**
 * Invitation schema — an offer of membership, addressed to exactly one
 * identifier (email XOR phone — service-validated; no synthetic values).
 * Expiry is computed from `expiresAt`, never stored as a status.
 */

import { pgEnum, pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { uomOrganization } from "./organization.model";
import { uomUser } from "./user.model";

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "revoked",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];
export const uomInvitationStatusEnum = pgEnum(
  "invitation_status",
  INVITATION_STATUSES,
);

export const uomInvitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => uomOrganization.id, { onDelete: "cascade" }),
    /** Exactly one of email/phone is set (XOR — enforced by the service). */
    email: text("email"),
    phone: text("phone"),
    /** Roles the membership gets on accept. */
    roles: text("roles").array().notNull(),
    status: uomInvitationStatusEnum("status").notNull().default("pending"),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => uomUser.id),
    /** Set on accept — which account claimed the invitation. */
    invitedUserId: text("invited_user_id"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("invitation_org_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
    index("invitation_phone_idx").on(table.phone),
  ],
);
export type UomInvitationSelect = typeof uomInvitation.$inferSelect;
