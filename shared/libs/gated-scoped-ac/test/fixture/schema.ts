// Drizzle (pg) schema for the lib's self-test. Ported from `theo/db.ts` rows
// (organization, user, membership, note, note_share). `user` (not app_user) per
// the integration note. roles is a json array column on membership.

import {
  jsonb,
  pgTable,
  pgView,
  text,
} from "drizzle-orm/pg-core";

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "company" | "system_admin"
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
});

export const membership = pgTable("membership", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),
  roles: jsonb("roles").$type<string[]>().notNull(),
});

export const note = pgTable("note", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  authorUserId: text("author_user_id").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  // a real text[] — the array shape `has` must match into. `membership.roles`
  // covers the jsonb shape; between them both collection paths are exercised.
  tags: text("tags").array(),
});

export const noteShare = pgTable("note_share", {
  id: text("id").primaryKey(),
  noteId: text("note_id").notNull(),
  kind: text("kind").notNull(), // "public" | "org" | "user" | "email"
  organizationId: text("organization_id"),
  userId: text("user_id"),
  email: text("email"),
  sharedByUserId: text("shared_by_user_id").notNull(),
});

// The child entity for the payload slot: appending one is allowed only if the
// caller may reach the NOTE it points at. Same shape as a song slice hanging off
// a song — the parent id arrives in the request body, never from an existing row.
export const noteComment = pgTable("note_comment", {
  id: text("id").primaryKey(),
  noteId: text("note_id").notNull(),
  authorUserId: text("author_user_id").notNull(),
  body: text("body").notNull(),
});

// A VIEW is just another source of rows to compute access over — scoped AC has
// no bespoke "view" concept, it takes one as an ordinary queryable table.
// `.existing()` means drizzle only *references* it (the DDL creates it).
export const noteWithAuthor = pgView("note_with_author", {
  id: text("id"),
  organizationId: text("organization_id"),
  authorUserId: text("author_user_id"),
  title: text("title"),
  authorEmail: text("author_email"),
}).existing();

// entity-name → table map injected into the engine + gate. Views sit in here
// next to the tables — same map, same treatment.
export const tables = {
  organization,
  user,
  membership,
  note,
  note_share: noteShare,
  note_comment: noteComment,
  note_with_author: noteWithAuthor,
} as const;

export type Tables = typeof tables;
