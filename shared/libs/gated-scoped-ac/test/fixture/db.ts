// PGlite + drizzle test db: create tables, seed the personas/notes/shares from
// `theo/db.ts`, and a `hydrate` helper that builds the nested session bag (D3) +
// effectiveRoles (membership roles for the active org + the `default` baseline),
// mirroring `theo/middleware.ts`.

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

import { membership, note, noteShare, organization, tables, user } from "./schema";

export type TestDb = ReturnType<typeof drizzle<Record<string, never>>> & {
  $client: PGlite;
};

// ── seed rows (ported from theo/db.ts) ──
const organizations = [
  { id: "altar", name: "Altar", type: "company" },
  { id: "konoha", name: "Konoha", type: "company" },
  { id: "hq", name: "System HQ", type: "system_admin" },
];

// `roles` here are USER roles, assigned at registration and stored on the row —
// separate from membership roles (a user role is never assignable to a
// membership, or vice versa). Everyone gets `default` at registration.
const users = [
  { id: "theo", email: "theo@altar.io", roles: ["default"] },
  { id: "kakashi", email: "kakashi@altar.io", roles: ["default"] },
  { id: "naruto", email: "naruto@altar.io", roles: ["default"] },
  { id: "sakura", email: "sakura@altar.io", roles: ["default"] },
  { id: "itachi", email: "itachi@altar.io", roles: ["default"] },
  { id: "sasuke", email: "sasuke@gmail.com", roles: ["default"] },
];

const memberships = [
  { id: "mem-theo-altar", userId: "theo", organizationId: "altar", roles: ["admin"] },
  { id: "mem-kakashi-altar", userId: "kakashi", organizationId: "altar", roles: ["manager"] },
  { id: "mem-kakashi-konoha", userId: "kakashi", organizationId: "konoha", roles: ["employee"] },
  { id: "mem-naruto-altar", userId: "naruto", organizationId: "altar", roles: ["employee"] },
  { id: "mem-sakura-altar", userId: "sakura", organizationId: "altar", roles: ["employee"] },
  { id: "mem-itachi-hq", userId: "itachi", organizationId: "hq", roles: ["sys_admin"] },
];

// `tags` exercises the array shape: note-4 leaves it NULL on purpose, so the
// negations can be checked for null-inclusiveness.
const notes = [
  { id: "note-1", organizationId: "altar", authorUserId: "kakashi", title: "Roadmap Q3", text: "Q3 priorities: ship AC refactor.", tags: ["urgent", "planning"] },
  { id: "note-2", organizationId: "altar", authorUserId: "kakashi", title: "Public Update", text: "We are hiring.", tags: ["hiring"] },
  { id: "note-3", organizationId: "altar", authorUserId: "naruto", title: "Naruto's Draft", text: "Rough ideas, not ready to share.", tags: ["urgent"] },
  { id: "note-4", organizationId: "konoha", authorUserId: "kakashi", title: "Konoha Memo", text: "Cross-org, shared with Altar.", tags: null },
];

const noteShares = [
  { id: "ns-1", noteId: "note-2", kind: "public", organizationId: null, userId: null, email: null, sharedByUserId: "kakashi" },
  { id: "ns-2", noteId: "note-3", kind: "user", organizationId: null, userId: "sakura", email: null, sharedByUserId: "naruto" },
  { id: "ns-3", noteId: "note-3", kind: "email", organizationId: null, userId: null, email: "sasuke@gmail.com", sharedByUserId: "naruto" },
  { id: "ns-4", noteId: "note-4", kind: "org", organizationId: "altar", userId: null, email: null, sharedByUserId: "kakashi" },
];

const DDL = `
  CREATE TABLE organization (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL);
  CREATE TABLE "user" (id TEXT PRIMARY KEY, email TEXT NOT NULL);
  CREATE TABLE membership (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, organization_id TEXT NOT NULL, roles JSONB NOT NULL);
  CREATE TABLE note (id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, author_user_id TEXT NOT NULL, title TEXT NOT NULL, text TEXT NOT NULL, tags TEXT[]);
  CREATE TABLE note_share (id TEXT PRIMARY KEY, note_id TEXT NOT NULL, kind TEXT NOT NULL, organization_id TEXT, user_id TEXT, email TEXT, shared_by_user_id TEXT NOT NULL);
  CREATE TABLE note_comment (id TEXT PRIMARY KEY, note_id TEXT NOT NULL, author_user_id TEXT NOT NULL, body TEXT NOT NULL);
  CREATE VIEW note_with_author AS
    SELECT n.id, n.organization_id, n.author_user_id, n.title, u.email AS author_email
    FROM note n JOIN "user" u ON u.id = n.author_user_id;
`;

export async function makeTestDb() {
  const client = new PGlite();
  const db = drizzle(client) as unknown as TestDb;
  await client.exec(DDL);
  await seed(db);
  return db;
}

export async function seed(db: TestDb) {
  await db.insert(organization).values(organizations);
  await db.insert(user).values(users);
  await db.insert(membership).values(memberships);
  await db.insert(note).values(notes);
  await db.insert(noteShare).values(noteShares);
}

// reset note + note_share to the seed (write tests mutate them)
export async function resetNotes(db: TestDb) {
  await db.delete(noteShare);
  await db.delete(note);
  await db.insert(note).values(notes);
  await db.insert(noteShare).values(noteShares);
}

export { tables };

// ── the nested session bag (D3) + effectiveRoles ──
export type SessionBag = {
  session: {
    user: { id: string; email: string };
    organization: { id: string; type: string } | null;
  };
};

export type Hydrated = { bag: SessionBag; effectiveRoles: string[] };

// The `default` USER role is assigned at registration and stored on the user
// row, exactly like a membership role is stored on the membership. Hydration
// reads it; it is NOT synthesised here. (Injecting baseline permissions into
// every request "by magic" was called out as a bug — the role has to be real.)
const userRolesOf = (userId: string): string[] =>
  users.find((u) => u.id === userId)?.roles ?? [];

// Mirror the real middleware: user roles (from the user row) + membership roles
// for the active org.
export function hydrate(
  userId: string,
  activeOrg: string | null = "altar",
  activeOrgType: string | null = "company",
): Hydrated {
  const u = users.find((x) => x.id === userId);
  const mem = memberships.find(
    (m) => m.userId === userId && m.organizationId === activeOrg,
  );
  const bag: SessionBag = {
    session: {
      user: { id: userId, email: u?.email ?? "" },
      organization:
        activeOrg && activeOrgType
          ? { id: activeOrg, type: activeOrgType }
          : null,
    },
  };
  const effectiveRoles = [...userRolesOf(userId), ...(mem?.roles ?? [])];
  return { bag, effectiveRoles };
}

// extra persona for the traversal demo: a company_auditor in altar (no seed
// membership needed — we just hand it the role).
export function hydrateWithRoles(
  userId: string,
  roles: string[],
  activeOrg: string | null = "altar",
  activeOrgType: string | null = "company",
): Hydrated {
  const base = hydrate(userId, activeOrg, activeOrgType);
  return { bag: base.bag, effectiveRoles: [...base.effectiveRoles, ...roles] };
}
