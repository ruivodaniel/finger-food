// PGlite + drizzle: the capsule tables and one versioned entity, meteor.
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { jsonb, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { capsuleTables, createVersioning } from "../../src/index";

export const meteor = pgTable("meteor", {
  id: text("id").primaryKey(),
  outerId: text("outer_id").notNull(),
  name: text("name").notNull(),
  diameterKm: numeric("diameter_km").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
});

const DDL = `
  create table outer_capsule (entity_id text primary key, entity_type text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz);
  create table branch (id text primary key, outer_capsule_id text not null references outer_capsule(entity_id), name text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz, unique (outer_capsule_id, name));
  create table inner_capsule (id text primary key, outer_capsule_id text not null references outer_capsule(entity_id), branch_id text not null references branch(id), entity_type text not null, entity_row_id text not null, created_at timestamptz not null, valid_from timestamptz not null, valid_to timestamptz, origin_kind text not null, author_id text not null, author_type text not null, is_main boolean not null, source_version_ids text[] not null default '{}');
  create unique index one_head_per_branch on inner_capsule (branch_id) where valid_to is null;
  create table version_delta (id text primary key, from_inner_capsule_id text not null references inner_capsule(id), to_inner_capsule_id text not null references inner_capsule(id), entity_type text not null, fields jsonb not null, computed_at timestamptz not null, unique (from_inner_capsule_id, to_inner_capsule_id));
  create table meteor (id text primary key, outer_id text not null, name text not null, diameter_km numeric not null, metadata jsonb not null default '{}');
`;

export async function makeTestDb() {
  const client = new PGlite();
  const db = drizzle(client);
  await client.exec(DDL);
  return db;
}

/** A clock the tests can move. */
export function makeClock(start = new Date("2026-01-01T00:00:00Z")) {
  let t = start.getTime();
  return { now: () => new Date(t), tick: (ms = 1000) => { t += ms; return new Date(t); } };
}

export function makeVersioning(clock: ReturnType<typeof makeClock>) {
  return createVersioning({ versioned: { meteor: { table: meteor, outerId: "outerId" } }, capsules: capsuleTables, now: clock.now });
}
export const author = { id: "daniel", type: "user" } as const;
