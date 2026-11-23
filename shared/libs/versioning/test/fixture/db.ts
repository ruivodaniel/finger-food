// PGlite + drizzle: the capsule tables (injected from ./capsules) and one versioned entity, meteor.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { jsonb, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { createVersioning, defineVersionedEntity, type VersionedEntry } from "../../src/index";
import { capsuleTables } from "./capsules";

export const meteor = pgTable("meteor", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  diameterKm: numeric("diameter_km").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
});

const DDL = `
  create table outer_capsule (id text primary key, entity_id text not null unique, entity_type text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz);
  create table branch (id text primary key, outer_capsule_id text not null references outer_capsule(id), name text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz, unique (outer_capsule_id, name));
  create table inner_capsule (id text primary key, outer_capsule_id text not null references outer_capsule(id), branch_id text not null references branch(id), entity_type text not null, entity_row_id text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz, origin_kind text not null, author_id text not null, author_type text not null, instructed_by_id text, author_workflow_id text, author_model_version text, title text, slug text, is_main boolean not null, source_version_ids text[] not null default '{}', intent_what text, intent_why text, seq integer not null);
  create unique index one_head_per_branch on inner_capsule (branch_id) where valid_to is null;
  create unique index seq_per_branch on inner_capsule (branch_id, seq);
  create unique index slug_among_main_heads on inner_capsule (entity_type, slug) where valid_to is null and is_main and slug is not null;
  create table version_delta (id text primary key, from_inner_capsule_id text not null references inner_capsule(id), to_inner_capsule_id text not null references inner_capsule(id), entity_type text not null, fields jsonb not null, computed_at timestamptz not null, unique (from_inner_capsule_id, to_inner_capsule_id));
  create table meteor (id text primary key, name text not null, diameter_km numeric not null, metadata jsonb not null default '{}');
`;

export async function makeTestDb() {
  const client = new PGlite();
  const db = drizzle(client);
  await client.exec(DDL);
  return db;
}

/** A clock the tests can move. */
export function makeClock(start = new Date("2026-01-01T00:00:00Z")) {
  let time = start.getTime();
  return { now: () => new Date(time), tick: (milliseconds = 1000) => { time += milliseconds; return new Date(time); } };
}

export const meteorEntry = defineVersionedEntity("meteor", { table: meteor, title: (row) => row.name, slug: (row) => row.name.toLowerCase() });

/** The versioning the tests use: meteor in the versioned list, with a delta hook when one is given. */
export function makeVersioning(clock: ReturnType<typeof makeClock>, delta?: VersionedEntry<typeof meteor>["delta"]) {
  return createVersioning({ versioned: [{ ...meteorEntry, delta }], capsules: capsuleTables, now: clock.now });
}
export const author = { id: "daniel", type: "user" } as const;
