/**
 * The locks routes over HTTP — GET /locks, GET · PUT · DELETE /locks/:kind/:documentId — under the SHIPPING rules.
 *
 * Altitude: collaboration's REAL router, service and repository, mounted with `mountCollaborationApi`, on the REAL
 * config + engine + gate on PGlite, the gate over a db that versions meteors (the app's versionedGatedDb). Only the
 * session is stubbed: a header names the caller and their active org, and the bag is hydrated as the middleware does.
 * Meteor isn't a collaborative kind yet, so a stand-in kind named "meteor" is registered: it only titles the locks.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createAc, createGatedDb, type SchemaTables } from "@libs/gated-scoped-ac";
import { createVersionedDb, createVersioning, type Author } from "@libs/versioning";
import { accessControlConfig } from "@configs/access-control";
import { mountCollaborationApi, type CollaborativeKind } from "@modules/collaboration/api";
import type { DocumentLockPage, DocumentLockState, DocumentLockView } from "@modules/collaboration/shared";
import { documentLock } from "@modules/collaboration/models";
import { capsuleTables } from "@modules/versioning/models";
import { meteorVersionedEntry } from "@product/implementation-patterns/api";
import { meteor } from "@product/implementation-patterns/models";
import { eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";

import { hydrate, idColumns, makeDb, tables as uomTables, type TestDb } from "./harness";

const MIGRATIONS = join(__dirname, "../../../drizzle");
const tables: SchemaTables = { ...uomTables, meteor, document_lock: documentLock };
const engine = createAc({ ...accessControlConfig, tables });
const versioning = createVersioning({ versioned: [meteorVersionedEntry], capsules: capsuleTables });
const T0 = new Date("2026-01-01T00:00:00.000Z");

async function runMigrationCreating(db: TestDb, table: string) {
  const file = readdirSync(MIGRATIONS).find((name) => name.endsWith(".sql") && readFileSync(join(MIGRATIONS, name), "utf8").includes(`CREATE TABLE "${table}"`))!;
  for (const statement of readFileSync(join(MIGRATIONS, file), "utf8").split("--> statement-breakpoint")) {
    if (statement.trim()) await db.$client.exec(statement);
  }
}

let db: TestDb;
let app: Hono;

/** A db that versions meteors: with an author it writes versions, without one it reads current rows. */
const versionedDb = (author?: () => Author) => createVersionedDb(db, { versioning, entries: [meteorVersionedEntry], author });

async function addMeteor(id: string, organizationId: string) {
  const seed = versionedDb(() => ({ id: "seed", type: "user" }));
  await seed.insert(meteor).values({ id, organizationId, createdBy: "seed", name: id, status: "draft", createdAt: T0, updatedAt: T0 });
  await seed.update(meteor).set({ name: `${id} edited` }).where(eq(meteor.id, id));
}

/** Only the steps a lock reads: its title. Live editing isn't this test's subject. */
const meteorKind = {
  kind: "meteor",
  titlesOf: async (ids: string[]) => new Map((await versionedDb().select().from(meteor).where(inArray(meteor.id, ids))).map((row) => [row.id, row.name] as const)),
} as unknown as CollaborativeKind;

// One database for the file: building one per test is what makes the whole suite time out. Each test starts with no locks.
beforeEach(async () => {
  await db.delete(documentLock);
});
beforeAll(async () => {
  db = await makeDb();
  await runMigrationCreating(db, "meteor");
  await runMigrationCreating(db, "outer_capsule");
  await runMigrationCreating(db, "document_lock");
  await addMeteor("ceres", "org-a");
  await addMeteor("vesta", "org-b");

  let lockSeq = 0;
  const { router, services } = mountCollaborationApi({
    rooms: { join: () => undefined, leave: () => undefined, pushToRoom: async () => undefined },
    actorOf: async (actorId) => ({ name: `name of ${actorId}`, image: null }),
    engine,
    gatedDb: Object.assign(
      (bag: unknown) => createGatedDb(versionedDb(() => ({ id: (bag as { session: { user: { id: string } } }).session.user.id, type: "user" })), { tables, engine, idColumns })(bag),
      { ungated: () => versionedDb() },
    ),
    createId: () => `lock-${++lockSeq}`,
    errors: {
      notFound: (message) => new HTTPException(404, { message }),
      badRequest: (message) => new HTTPException(400, { message }),
      unauthorized: (message) => new HTTPException(401, { message }),
      forbidden: (message) => new HTTPException(403, { message }),
      conflict: (message) => new HTTPException(409, { message }),
      unprocessable: (message) => new HTTPException(422, { message }),
    },
  });
  services.collaboration.registerKind(meteorKind);

  app = new Hono();
  // the session, as a header: x-as = "<userId>@<activeOrgId>" or "<userId>"; none is nobody
  app.use("*", async (c, next) => {
    const as = c.req.header("x-as");
    if (as) {
      const [userId, orgId] = as.split("@") as [string, string | undefined];
      const ctx = hydrate(engine, userId, orgId ?? null);
      c.set("user" as never, { id: userId } as never);
      c.set("scopedAc" as never, { bag: ctx.bag, permissions: ctx.permissions } as never);
    } else c.set("user" as never, null as never);
    await next();
  });
  app.route("/collaboration", router);
  app.onError((error, c) => (error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: String(error) }, 500)));
});

const call = (method: string, path: string, as?: string) => app.request(`/collaboration/locks${path}`, { method, headers: as ? { "x-as": as } : {} });
const json = async <T>(response: Response) => ({ status: response.status, body: (await response.json()) as T });

const MANAGER_A = "u-mgr-a@org-a", OWNER_A = "u-owner-a@org-a", STANDARD_A = "u-std-a@org-a", OWNER_B = "u-owner-b@org-b", ADMIN = "u-sys@org-s";

describe("the state of a document's lock", () => {
  test("unlocked: a manager may lock, a standard member may not, nobody may unlock", async () => {
    expect((await json<DocumentLockState>(await call("GET", "/meteor/ceres", MANAGER_A))).body).toEqual({ lock: null, canLock: true, canUnlock: false });
    expect((await json<DocumentLockState>(await call("GET", "/meteor/ceres", STANDARD_A))).body).toEqual({ lock: null, canLock: false, canUnlock: false });
  });

  test("locked: the company sees who and when; a manager may unlock, a standard member may not", async () => {
    await call("PUT", "/meteor/ceres", MANAGER_A);
    const manager = (await json<DocumentLockState>(await call("GET", "/meteor/ceres", OWNER_A))).body;
    expect(manager).toMatchObject({ canLock: false, canUnlock: true, lock: { kind: "meteor", documentId: "ceres", title: "ceres edited", lockedBy: "u-mgr-a", lockedByName: "name of u-mgr-a" } });
    expect((await json<DocumentLockState>(await call("GET", "/meteor/ceres", STANDARD_A))).body).toMatchObject({ canUnlock: false, lock: { documentId: "ceres" } });
  });

  test("another company doesn't see the lock", async () => {
    await call("PUT", "/meteor/ceres", MANAGER_A);
    expect((await json<DocumentLockState>(await call("GET", "/meteor/ceres", OWNER_B))).body.lock).toBeNull();
  });

  test("an unknown kind is a 404; nobody signed in is a 401", async () => {
    expect((await call("GET", "/goal/ceres", MANAGER_A)).status).toBe(404);
    expect((await call("GET", "/meteor/ceres")).status).toBe(401);
  });
});

describe("locking", () => {
  test("a manager locks; locking again is a 409", async () => {
    const locked = await json<DocumentLockView>(await call("PUT", "/meteor/ceres", MANAGER_A));
    expect(locked.status).toBe(201);
    expect(locked.body).toMatchObject({ documentId: "ceres", lockedBy: "u-mgr-a" });
    expect((await call("PUT", "/meteor/ceres", OWNER_A)).status).toBe(409);
  });

  test("a standard member, another company and a system admin can't lock", async () => {
    expect((await call("PUT", "/meteor/ceres", STANDARD_A)).status).toBe(403);
    expect((await call("PUT", "/meteor/ceres", OWNER_B)).status).toBe(403);
    expect((await call("PUT", "/meteor/ceres", ADMIN)).status).toBe(403);
    expect(await db.select().from(documentLock)).toHaveLength(0);
  });

  test("a meteor that doesn't exist can't be locked", async () => {
    expect((await call("PUT", "/meteor/nope", MANAGER_A)).status).toBe(403);
  });
});

describe("unlocking", () => {
  beforeEach(async () => {
    await call("PUT", "/meteor/ceres", MANAGER_A);
    await call("PUT", "/meteor/vesta", OWNER_B);
  });

  test("an owner unlocks what a manager locked", async () => {
    expect((await call("DELETE", "/meteor/ceres", OWNER_A)).status).toBe(200);
    expect((await json<DocumentLockState>(await call("GET", "/meteor/ceres", MANAGER_A))).body.lock).toBeNull();
  });

  test("a standard member can't unlock; another company doesn't even see the lock", async () => {
    expect((await call("DELETE", "/meteor/ceres", STANDARD_A)).status).toBe(403);
    expect((await call("DELETE", "/meteor/ceres", OWNER_B)).status).toBe(404);
    expect(await db.select().from(documentLock)).toHaveLength(2);
  });

  test("a system admin unlocks any company's", async () => {
    expect((await call("DELETE", "/meteor/ceres", ADMIN)).status).toBe(200);
    expect((await call("DELETE", "/meteor/vesta", ADMIN)).status).toBe(200);
    expect(await db.select().from(documentLock)).toHaveLength(0);
  });

  test("nothing to unlock is a 404", async () => {
    await call("DELETE", "/meteor/ceres", OWNER_A);
    expect((await call("DELETE", "/meteor/ceres", OWNER_A)).status).toBe(404);
  });
});

describe("the locks among some documents: a list's marks", () => {
  beforeEach(async () => {
    await call("PUT", "/meteor/ceres", MANAGER_A);
    await call("PUT", "/meteor/vesta", OWNER_B);
  });

  test("one call answers the locks the caller sees among the ids asked for", async () => {
    const locks = (await json<DocumentLockView[]>(await call("GET", "/meteor?ids=ceres,vesta,nope", STANDARD_A))).body;
    expect(locks).toMatchObject([{ documentId: "ceres", lockedByName: "name of u-mgr-a" }]);
    expect((await json<DocumentLockView[]>(await call("GET", "/meteor?ids=ceres,vesta", ADMIN))).body.map((lock) => lock.documentId).sort()).toEqual(["ceres", "vesta"]);
  });

  test("no ids asks nothing; an unknown kind is a 404", async () => {
    expect((await json<DocumentLockView[]>(await call("GET", "/meteor?ids=", STANDARD_A))).body).toEqual([]);
    expect((await call("GET", "/goal?ids=ceres", STANDARD_A)).status).toBe(404);
  });
});

describe("the locks list", () => {
  beforeEach(async () => {
    await call("PUT", "/meteor/ceres", MANAGER_A);
    await call("PUT", "/meteor/vesta", OWNER_B);
  });

  test("a company sees its own, titled and named", async () => {
    const { body } = await json<DocumentLockPage>(await call("GET", "", STANDARD_A));
    expect(body.total).toBe(1);
    expect(body.rows).toMatchObject([{ documentId: "ceres", title: "ceres edited", lockedByName: "name of u-mgr-a", canUnlock: false }]);
    expect((await json<DocumentLockPage>(await call("GET", "", MANAGER_A))).body.rows).toMatchObject([{ documentId: "ceres", canUnlock: true }]);
  });

  test("a system admin sees every company's, paged", async () => {
    const all = (await json<DocumentLockPage>(await call("GET", "", ADMIN))).body;
    expect(all.total).toBe(2);
    expect(all.rows.map((row) => row.documentId).sort()).toEqual(["ceres", "vesta"]);
    expect(all.rows.every((row) => row.canUnlock)).toBe(true);
    const firstPage = (await json<DocumentLockPage>(await call("GET", "?pageSize=1", ADMIN))).body;
    expect(firstPage).toMatchObject({ total: 2, rows: [{}] });
  });

  test("no active company, no locks", async () => {
    expect((await json<DocumentLockPage>(await call("GET", "", "u-mgr-a"))).body).toEqual({ rows: [], total: 0 });
  });
});
