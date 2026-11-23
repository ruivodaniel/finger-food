/**
 * Identity schema — the local identity provider's own tables: who can sign in,
 * the addresses they sign in with, their sessions and the pending code flows.
 *
 * `user.identityId` joins an app user to one `identity` row. Tokens and codes
 * are stored hashed; the raw values only travel to the person.
 */

import { boolean, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const uomIdentity = pgTable("identity", {
  id: text("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at").notNull(),
});

export const uomIdentityAddress = pgTable(
  "identity_address",
  {
    id: text("id").primaryKey(),
    identityId: text("identity_id").notNull(),
    via: text("via", { enum: ["email", "sms"] }).notNull(),
    /** The address as typed, lowercased for email. Unique across identities. */
    value: text("value").notNull().unique(),
    verified: boolean("verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
  },
  (t) => [index("identity_address_identity_idx").on(t.identityId)],
);

export const uomIdentitySession = pgTable(
  "identity_session",
  {
    id: text("id").primaryKey(),
    /** sha256 of the session token. The token itself is never stored. */
    tokenHash: text("token_hash").notNull().unique(),
    identityId: text("identity_id").notNull(),
    methods: jsonb("methods").$type<{ method: string; completedAt?: string }[]>().notNull(),
    active: boolean("active").notNull().default(true),
    authenticatedAt: timestamp("authenticated_at").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [index("identity_session_identity_idx").on(t.identityId)],
);

export const uomIdentityFlow = pgTable("identity_flow", {
  id: text("id").primaryKey(),
  kind: text("kind", { enum: ["code_registration", "login", "verification", "recovery"] }).notNull(),
  identifier: text("identifier"),
  traits: jsonb("traits").$type<{ email?: string; phone?: string; name?: string }>(),
  /** sha256 of the emailed code. */
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
});
