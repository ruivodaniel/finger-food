// The versioned db, against the same plain queries as the raw db. The queries are written once and run on either.
import { and, asc, eq, inArray, like, sql } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it } from "vitest";
import { createVersionedDb, StaleHead } from "../src/index";
import { innerCapsule, outerCapsule } from "./fixture/capsules";
import { author, makeClock, makeTestDb, makeVersioning, meteor, meteorEntry } from "./fixture/db";

const crater = pgTable("crater", { id: text("id").primaryKey(), meteorId: text("meteor_id").notNull(), name: text("name").notNull() });

let db: Awaited<ReturnType<typeof makeTestDb>>;
let clock: ReturnType<typeof makeClock>;
let versioning: ReturnType<typeof makeVersioning>;
let versionedDb: typeof db;

const addMeteor = async (handle: typeof db, name: string) => (await handle.insert(meteor).values({ id: crypto.randomUUID(), name, diameterKm: "1" }).returning())[0]!;
const rename = async (handle: typeof db, id: string, name: string) => (await handle.update(meteor).set({ name }).where(eq(meteor.id, id)).returning())[0];
const addCrater = (id: string, meteorId: string, name: string) => db.insert(crater).values({ id, meteorId, name });

beforeEach(async () => {
  db = await makeTestDb();
  await db.execute(sql`create table crater (id text primary key, meteor_id text not null, name text not null)`);
  clock = makeClock();
  versioning = makeVersioning(clock);
  versionedDb = createVersionedDb(db, { versioning: versioning as never, entries: [meteorEntry], author });
});

describe("reads", () => {
  it("one current row per identity, with the entity id as id", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    clock.tick(); await rename(versionedDb, created.id, "Ceres (dwarf)");
    expect(await versionedDb.select().from(meteor)).toEqual([{ ...created, name: "Ceres (dwarf)" }]);
    expect(await versionedDb.select().from(meteor).where(eq(meteor.id, created.id))).toHaveLength(1);
    expect(await db.select().from(meteor)).toHaveLength(2);
  });
  it("a condition on an old value finds nothing; partial selects, order and limit work", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    await addMeteor(versionedDb, "Vesta");
    clock.tick(); await rename(versionedDb, created.id, "Zeus");
    expect(await versionedDb.select().from(meteor).where(like(meteor.name, "Ceres"))).toEqual([]);
    expect(await versionedDb.select({ id: meteor.id, name: meteor.name }).from(meteor).orderBy(asc(meteor.name)).limit(1).where(like(meteor.name, "Z%"))).toEqual([{ id: created.id, name: "Zeus" }]);
    expect((await versionedDb.selectDistinct({ name: meteor.name }).from(meteor).orderBy(asc(meteor.name))).map((row) => row.name)).toEqual(["Vesta", "Zeus"]);
  });
  it("a removed identity leaves the reads, and its rows stay", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    clock.tick(); await versionedDb.delete(meteor).where(eq(meteor.id, created.id));
    expect(await versionedDb.select().from(meteor)).toEqual([]);
    expect(await db.select().from(meteor)).toHaveLength(1);
  });
});

describe("joins and subqueries see only current rows", () => {
  let ceresId: string;
  beforeEach(async () => {
    ceresId = (await addMeteor(versionedDb, "Ceres")).id;
    clock.tick(); await rename(versionedDb, ceresId, "Ceres (dwarf)");
    await addCrater("c1", ceresId, "Occator");
    await addCrater("c2", "gone", "Nowhere");
  });
  it("inner join, joined from another table", async () => {
    expect(await versionedDb.select({ crater: crater.name, meteor: meteor.name }).from(crater).innerJoin(meteor, eq(meteor.id, crater.meteorId))).toEqual([{ crater: "Occator", meteor: "Ceres (dwarf)" }]);
  });
  it("left join, with every column, in drizzle's usual shape", async () => {
    const rows = await versionedDb.select().from(crater).leftJoin(meteor, eq(meteor.id, crater.meteorId)).orderBy(asc(crater.id));
    expect(rows.map((row) => [row.crater.id, row.meteor?.id ?? null, row.meteor?.name ?? null])).toEqual([["c1", ceresId, "Ceres (dwarf)"], ["c2", null, null]]);
  });
  it("from the table, joining another", async () => {
    const rows = await versionedDb.select().from(meteor).innerJoin(crater, eq(crater.meteorId, meteor.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.meteor).toMatchObject({ id: ceresId, name: "Ceres (dwarf)" });
  });
  it("cross join", async () => {
    const rows = await versionedDb.select({ crater: crater.id, meteor: meteor.name }).from(crater).crossJoin(meteor).orderBy(asc(crater.id));
    expect(rows).toEqual([{ crater: "c1", meteor: "Ceres (dwarf)" }, { crater: "c2", meteor: "Ceres (dwarf)" }]);
  });
  it("a subquery from the same db", async () => {
    const rows = await versionedDb.select().from(crater).where(inArray(crater.meteorId, versionedDb.select({ id: meteor.id }).from(meteor)));
    expect(rows.map((row) => row.id)).toEqual(["c1"]);
  });
  it("a removed identity leaves the joins", async () => {
    clock.tick(); await versionedDb.delete(meteor).where(eq(meteor.id, ceresId));
    expect(await versionedDb.select().from(crater).innerJoin(meteor, eq(meteor.id, crater.meteorId))).toEqual([]);
  });
});

describe("writes", () => {
  it("an insert keeps the given id as the entity id, and the row has its own", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    const [row] = await db.select().from(meteor);
    expect(row!.id).not.toBe(created.id);
    const [identity] = await db.select().from(outerCapsule);
    expect(identity!.entityId).toBe(created.id);
    expect((await db.select().from(innerCapsule))[0]).toMatchObject({ entityRowId: row!.id, authorId: author.id, seq: 0 });
  });
  it("an update is a new row and a new version: no row is ever updated", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    const [firstRow] = await db.select().from(meteor);
    clock.tick(); expect(await rename(versionedDb, created.id, "Ceres (dwarf)")).toMatchObject({ id: created.id, name: "Ceres (dwarf)" });
    const rows = await db.select().from(meteor);
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === firstRow!.id)).toEqual(firstRow);
    expect(await db.select().from(innerCapsule)).toHaveLength(2);
  });
  it("an update that matches nothing, or changes nothing, makes no version", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    expect(await rename(versionedDb, "unknown", "x")).toBeUndefined();
    await rename(versionedDb, created.id, "Ceres");
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
  });
  it("an update's condition may use any column, and versions each match", async () => {
    await addMeteor(versionedDb, "Ceres"); await addMeteor(versionedDb, "Vesta");
    clock.tick();
    const saved = await versionedDb.update(meteor).set({ diameterKm: "2" }).where(and(like(meteor.name, "%e%"))).returning();
    expect(saved).toHaveLength(2);
    expect(await db.select().from(innerCapsule)).toHaveLength(4);
  });
  it("awaited without returning()", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    clock.tick(); await versionedDb.update(meteor).set({ name: "Vesta" }).where(eq(meteor.id, created.id));
    expect((await versionedDb.select().from(meteor))[0]!.name).toBe("Vesta");
  });
  it("write options reach the library: a head that moved is refused, as staleHeadError says", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    const head = (await versioning.getHead(db, "meteor", created.id))!.versionId;
    clock.tick(); await rename(versionedDb, created.id, "Second");
    const stale = createVersionedDb(db, { versioning: versioning as never, entries: [meteorEntry], author, writeOptions: { expectedHead: head } });
    clock.tick(); await expect(rename(stale, created.id, "Third")).rejects.toBeInstanceOf(StaleHead);
    const named = createVersionedDb(db, { versioning: versioning as never, entries: [meteorEntry], author, writeOptions: { expectedHead: head }, staleHeadError: () => new Error("reload") });
    await expect(rename(named, created.id, "Third")).rejects.toThrow("reload");
    expect((await versionedDb.select().from(meteor))[0]!.name).toBe("Second");
  });
  it("a repository's own transaction: a rollback keeps nothing", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    clock.tick();
    await expect(versionedDb.transaction(async (tx) => { await rename(tx as never, created.id, "Vesta"); throw new Error("rollback"); })).rejects.toThrow("rollback");
    expect((await versionedDb.select().from(meteor))[0]!.name).toBe("Ceres");
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
  });
});

describe("the edges", () => {
  it("a table of no entity runs as written", async () => {
    await versionedDb.insert(crater).values({ id: "c1", meteorId: "x", name: "Occator" });
    await versionedDb.update(crater).set({ name: "Dantu" }).where(eq(crater.id, "c1"));
    expect(await versionedDb.select().from(crater)).toEqual([{ id: "c1", meteorId: "x", name: "Dantu" }]);
    await versionedDb.delete(crater).where(eq(crater.id, "c1"));
    expect(await versionedDb.select().from(crater)).toEqual([]);
    expect(await db.select().from(innerCapsule)).toHaveLength(0);
  });
  it("what can't be versioned throws", () => {
    expect(() => versionedDb.execute(sql`select 1`)).toThrow("execute can't be versioned");
    expect(() => versionedDb.$count(meteor)).toThrow("$count can't be versioned");
  });
  it("returning() with fields gives the table's own columns under their names, as a gated delete asks", async () => {
    const created = await addMeteor(versionedDb, "Ceres");
    expect(await versionedDb.update(meteor).set({ name: "Ceres I" }).where(eq(meteor.id, created.id)).returning({ key: meteor.id, called: meteor.name })).toEqual([{ key: created.id, called: "Ceres I" }]);
    expect(await versionedDb.delete(meteor).where(eq(meteor.id, created.id)).returning({ id: meteor.id })).toEqual([{ id: created.id }]);
  });
  it("the author is asked for only when something is written", async () => {
    let asked = 0;
    const readsOnly = createVersionedDb(db, { versioning: versioning as never, entries: [meteorEntry], author: () => { asked += 1; return author; } });
    await addMeteor(versionedDb, "Ceres");
    await readsOnly.select().from(meteor);
    expect(asked).toBe(0);
    await addMeteor(readsOnly, "Vesta");
    expect(asked).toBe(1);
  });
  it("a db made without an author reads, and refuses to write", async () => {
    const noAuthor = createVersionedDb(db, { versioning: versioning as never, entries: [meteorEntry] });
    await addMeteor(versionedDb, "Ceres");
    expect(await noAuthor.select().from(meteor)).toHaveLength(1);
    await expect(addMeteor(noAuthor, "Vesta")).rejects.toThrow("a write needs an author");
  });
  it("an update or delete with no where is refused, not run on every row", async () => {
    await addMeteor(versionedDb, "Ceres");
    await expect((async () => { await versionedDb.update(meteor).set({ name: "x" }); })()).rejects.toThrow("needs a where()");
    await expect((async () => { await versionedDb.delete(meteor); })()).rejects.toThrow("needs a where()");
    expect((await versionedDb.select().from(meteor))[0]!.name).toBe("Ceres");
  });
});

describe("the same queries on the raw db", () => {
  it("plain rows, plain updates, the same result shapes, and no capsule", async () => {
    const created = await addMeteor(db, "Ceres");
    expect(await rename(db, created.id, "Vesta")).toEqual({ ...created, name: "Vesta" });
    expect(await db.select().from(meteor)).toEqual([{ ...created, name: "Vesta" }]);
    await addCrater("c1", created.id, "Occator");
    const joined = await db.select().from(meteor).innerJoin(crater, eq(crater.meteorId, meteor.id));
    expect(joined[0]!.meteor).toEqual({ ...created, name: "Vesta" });
    expect(await db.select().from(innerCapsule)).toHaveLength(0);
  });
});
