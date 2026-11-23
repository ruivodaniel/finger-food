/**
 * Document locks under the SHIPPING access rules — who may see, lock and unlock a meteor's lock.
 *
 * Altitude: the REAL config + engine + gated db on PGlite (the harness seed), with the meteor, capsule and
 * document_lock tables from the REAL migrations. The gate runs over a db that versions meteors, as the app's
 * versionedGatedDb does: a meteor has several rows, and the rules' join from a lock to its meteor must land on the
 * meteor's identity, not on one of its rows.
 *
 * TST4: the shipping config is the subject —
 *   - company_manager and company_owner lock and unlock their company's meteors (create_lock_company, delete_lock_company);
 *   - company_standard only sees them (read_lock_company);
 *   - another company neither sees nor touches them;
 *   - system_admin_owner sees and unlocks every lock, anywhere (read_all_locks_system, delete_all_locks_system).
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createGatedDb, type SchemaTables } from "@libs/gated-scoped-ac";
import { createVersionedDb, createVersioning, type Author } from "@libs/versioning";
import { accessControlConfig } from "@configs/access-control";
import { documentLock } from "@modules/collaboration/models";
import { capsuleTables } from "@modules/versioning/models";
import { meteorVersionedEntry } from "@product/implementation-patterns/api";
import { meteor } from "@product/implementation-patterns/models";
import { createAc } from "@libs/gated-scoped-ac";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { hydrate, idColumns, makeDb, tables as uomTables, type TestDb } from "./harness";

const MIGRATIONS = join(__dirname, "../../../drizzle");
const tables: SchemaTables = { ...uomTables, meteor, document_lock: documentLock };
const engine = createAc({ ...accessControlConfig, tables });
const versioning = createVersioning({ versioned: [meteorVersionedEntry], capsules: capsuleTables });

/** The statements of the migration that creates this table. */
async function runMigrationCreating(db: TestDb, table: string) {
  const file = readdirSync(MIGRATIONS).find((name) => name.endsWith(".sql") && readFileSync(join(MIGRATIONS, name), "utf8").includes(`CREATE TABLE "${table}"`))!;
  for (const statement of readFileSync(join(MIGRATIONS, file), "utf8").split("--> statement-breakpoint")) {
    if (statement.trim()) await db.$client.exec(statement);
  }
}

let db: TestDb;
/** The gate a request of this user, acting in this org, gets: over a db that versions meteors, as the app's. */
const as = (userId: string, activeOrgId: string | null) => {
  const ctx = hydrate(engine, userId, activeOrgId);
  const author: Author = { id: userId, type: "user" };
  const versioned = createVersionedDb(db, { versioning, entries: [meteorVersionedEntry], author });
  return { ...ctx, gate: createGatedDb(versioned, { tables, engine, idColumns })(ctx.bag) };
};

const T0 = new Date("2026-01-01T00:00:00.000Z");
/** A meteor of an org, through the versioned db, then edited once: two rows, one identity. */
async function addMeteor(id: string, organizationId: string) {
  const versioned = createVersionedDb(db, { versioning, entries: [meteorVersionedEntry], author: { id: "seed", type: "user" } });
  await versioned.insert(meteor).values({ id, organizationId, createdBy: "seed", name: id, status: "draft", createdAt: T0, updatedAt: T0 });
  await versioned.update(meteor).set({ name: `${id} edited` }).where(eq(meteor.id, id));
}

/** What a lock's create sends: the gate checks it as the request body. */
const lockOf = (documentId: string, lockedBy: string) => ({ id: `lock-${documentId}`, kind: "meteor", documentId, lockedBy, createdAt: T0 });

/** Locks the caller may see. */
const visibleLocks = async (caller: ReturnType<typeof as>) => {
  const scope = engine.resolveRead(caller.permissions, "document_lock", caller.bag);
  return ((await caller.gate.read("document_lock", scope).rows()) as { documentId: string }[]).map((row) => row.documentId);
};

/** A lock the seed puts in place, ungated. */
const seedLock = (documentId: string) => db.insert(documentLock).values(lockOf(documentId, "seed"));

// One database for the file: building one per test is what makes the whole suite time out. Each test starts with no locks.
beforeAll(async () => {
  db = await makeDb();
  await runMigrationCreating(db, "meteor");
  await runMigrationCreating(db, "outer_capsule");
  await runMigrationCreating(db, "document_lock");
  await addMeteor("ceres", "org-a");
  await addMeteor("vesta", "org-b");
  await addMeteor("pallas", "org-a");
});
beforeEach(async () => {
  await db.delete(documentLock);
});

describe("the setup", () => {
  test("a meteor has two rows and one identity: the rules must reach the identity", async () => {
    expect(await db.select().from(meteor).where(eq(meteor.name, "ceres edited"))).toHaveLength(1);
    expect(await db.select().from(meteor)).toHaveLength(6);
  });
});

describe("locking: create", () => {
  test("a manager and an owner lock their company's meteor", async () => {
    const manager = as("u-mgr-a", "org-a");
    expect(await manager.gate.create("document_lock", manager.permissions, lockOf("ceres", "u-mgr-a"))).toMatchObject({ documentId: "ceres" });
    await db.delete(documentLock);
    const owner = as("u-owner-a", "org-a");
    expect(await owner.gate.create("document_lock", owner.permissions, lockOf("ceres", "u-owner-a"))).toMatchObject({ documentId: "ceres" });
  });

  test("a standard member can't lock", async () => {
    const standard = as("u-std-a", "org-a");
    expect(engine.allowCreate(standard.permissions, "document_lock", { ...standard.bag, requestBody: lockOf("ceres", "u-std-a") }).allow).toBe(false);
    expect(await standard.gate.create("document_lock", standard.permissions, lockOf("ceres", "u-std-a"))).toBeNull();
  });

  test("a manager can't lock another company's meteor, nor a meteor that doesn't exist", async () => {
    const manager = as("u-mgr-a", "org-a");
    expect(await manager.gate.create("document_lock", manager.permissions, lockOf("vesta", "u-mgr-a"))).toBeNull();
    expect(await manager.gate.create("document_lock", manager.permissions, lockOf("nope", "u-mgr-a"))).toBeNull();
    expect(await db.select().from(documentLock)).toHaveLength(0);
  });

  test("a system admin can't lock: unlocking is the break-glass, locking is the company's", async () => {
    const admin = as("u-sys", "org-s");
    expect(await admin.gate.create("document_lock", admin.permissions, lockOf("ceres", "u-sys"))).toBeNull();
  });
});

describe("seeing locks: read", () => {
  beforeEach(async () => {
    await seedLock("ceres");
    await seedLock("vesta");
  });

  test("every member of a company sees its locks, and only its", async () => {
    expect(await visibleLocks(as("u-std-a", "org-a"))).toEqual(["ceres"]);
    expect(await visibleLocks(as("u-mgr-a", "org-a"))).toEqual(["ceres"]);
    expect(await visibleLocks(as("u-owner-b", "org-b"))).toEqual(["vesta"]);
  });

  test("no active company, no locks", async () => {
    expect(await visibleLocks(as("u-mgr-a", null))).toEqual([]);
  });

  test("a system admin sees every lock", async () => {
    expect((await visibleLocks(as("u-sys", "org-s"))).sort()).toEqual(["ceres", "vesta"]);
  });

  test("a lock on a removed meteor leaves the company's view", async () => {
    await seedLock("pallas");
    expect((await visibleLocks(as("u-mgr-a", "org-a"))).sort()).toEqual(["ceres", "pallas"]);
    await db.transaction((tx) => versioning.remove(tx, "meteor", "pallas"));
    expect(await visibleLocks(as("u-mgr-a", "org-a"))).toEqual(["ceres"]);
  });
});

describe("unlocking: delete", () => {
  beforeEach(async () => {
    await seedLock("ceres");
    await seedLock("vesta");
  });
  const unlock = (caller: ReturnType<typeof as>, documentId: string) =>
    caller.gate.delete("document_lock", engine.resolveDelete(caller.permissions, "document_lock", caller.bag), `lock-${documentId}`);

  test("a manager unlocks their company's meteor, whoever locked it", async () => {
    expect(await unlock(as("u-mgr-a", "org-a"), "ceres")).toEqual({ id: "lock-ceres" });
  });

  test("a standard member can't unlock", async () => {
    expect(await unlock(as("u-std-a", "org-a"), "ceres")).toBeNull();
  });

  test("a company can't unlock another's", async () => {
    expect(await unlock(as("u-owner-b", "org-b"), "ceres")).toBeNull();
    expect(await db.select().from(documentLock)).toHaveLength(2);
  });

  test("a system admin unlocks anything, in any company", async () => {
    const admin = as("u-sys", "org-s");
    expect(await unlock(admin, "ceres")).toEqual({ id: "lock-ceres" });
    expect(await unlock(admin, "vesta")).toEqual({ id: "lock-vesta" });
  });
});
