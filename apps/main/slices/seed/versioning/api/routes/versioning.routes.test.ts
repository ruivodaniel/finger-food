// The /versioned routes against a real Postgres (PGlite), with an entity that exists only in this test: note.
// The slice knows no entity of its own; it works by entity name through the versioned list the app hands it.
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { defineVersionedEntity, type Author } from "@libs/versioning";
import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { pgTable, text } from "drizzle-orm/pg-core";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { createRequire } from "node:module";
import * as models from "../models";
import { outerCapsule, release } from "../models";
import { mountVersioningApi } from "../mount";
import type { ModuleErrors } from "../shared/module-errors";
import type { VersioningEnv } from "../types";
import type { BranchView, Comparison, History, VersionAt, VersionView } from "../../shared/types";

// drizzle-kit's ESM build can't load under vitest (it requires fs dynamically); its CommonJS build can.
const { pushSchema } = createRequire(import.meta.url)("drizzle-kit/api") as typeof import("drizzle-kit/api");

const note = pgTable("note", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
});

const daniel: Author = { id: "u-daniel", type: "user" };
const errors: ModuleErrors = {
  notFound: (message) => new HTTPException(404, { message }),
  badRequest: (message) => new HTTPException(400, { message }),
  unauthorized: (message) => new HTTPException(401, { message }),
  forbidden: (message) => new HTTPException(403, { message }),
  conflict: (message) => new HTTPException(409, { message }),
};

async function makeApp() {
  const client = new PGlite();
  const db = drizzle(client);
  const { apply } = await pushSchema({ ...models, note }, db as never);
  await apply();
  let time = new Date("2026-11-01T10:00:00Z").getTime();
  const clock = { now: () => new Date(time), tick: (minutes = 1) => { time += minutes * 60_000; return new Date(time); } };
  const noteEntry = defineVersionedEntity("note", { table: note, title: (row) => row.title });
  const { router, versioning } = mountVersioningApi({
    db, versioned: [noteEntry], createId: () => crypto.randomUUID(), errors, now: clock.now,
    // the owner of notes: the request's access context is what x-access said, "write" by default
    access: { note: async (scopedAc, _entityId, action) => scopedAc === "write" || (scopedAc === "read" && action === "read") },
    // the app's names: Daniel has one, anyone else none
    authorNamesOf: async (ids) => new Map(ids.filter((id) => id === "u-daniel").map((id) => [id, "Daniel"])),
  });
  const app = new Hono<VersioningEnv>();
  // the app's session middleware, as a header: x-actor signs a user in, "none" is nobody
  app.use("*", async (context, next) => {
    const actor = context.req.header("x-actor") ?? "u-reader";
    context.set("user", actor === "none" ? null : { id: actor });
    context.set("scopedAc", context.req.header("x-access") ?? "write");
    await next();
  });
  app.route("/versioned", router);
  app.onError((error, context) => (error instanceof HTTPException ? context.json({ error: error.message }, error.status) : context.json({ error: error.message }, 500)));

  /** a note through the library, as the slice that owns notes would make one */
  async function createNote(title: string) {
    const entityId = await versioning.createOuterCapsule(db, "note");
    const rowId = crypto.randomUUID();
    await db.insert(note).values({ id: rowId, title });
    await versioning.createFirstInnerCapsule(db, "note", rowId, entityId, daniel);
    return entityId;
  }
  async function editNote(entityId: string, patch: { title?: string; body?: string }) {
    clock.tick();
    await db.transaction((tx) => versioning.save(tx, "note", entityId, patch, daniel));
  }
  const request = (path: string, init?: RequestInit) => app.request(`/versioned${path}`, init);
  const getJson = async <TBody,>(path: string) => {
    const response = await request(path);
    return { status: response.status, body: (await response.json()) as TBody };
  };
  const postJson = (path: string, body: object) => request(path, { method: "POST", headers: { "content-type": "application/json", "x-actor": "u-daniel" }, body: JSON.stringify(body) });
  return { db, versioning, clock, createNote, editNote, request, getJson, postJson };
}

let app: Awaited<ReturnType<typeof makeApp>>;
beforeEach(async () => { app = await makeApp(); });

describe("who is asking", () => {
  it("every route needs a signed-in user, reads included", async () => {
    const entityId = await app.createNote("Groceries");
    expect((await app.request(`/note/${entityId}/history`, { headers: { "x-actor": "none" } })).status).toBe(401);
    expect((await app.request(`/note/${entityId}/clone`, { method: "POST", headers: { "content-type": "application/json", "x-actor": "none" }, body: JSON.stringify({ from: crypto.randomUUID() }) })).status).toBe(401);
  });
});

describe("what the entity's owner allows", () => {
  it("not readable is a 404 on every route, so nobody learns it exists", async () => {
    const entityId = await app.createNote("Groceries");
    const head = (await app.versioning.getHead(app.db, "note", entityId))!.versionId;
    const none = { "x-access": "none", "content-type": "application/json" };
    expect((await app.request(`/note/${entityId}/history`, { headers: none })).status).toBe(404);
    expect((await app.request(`/note/${entityId}/versions/${head}`, { headers: none })).status).toBe(404);
    expect((await app.request(`/note/${entityId}/clone`, { method: "POST", headers: none, body: JSON.stringify({ from: head }) })).status).toBe(404);
  });
  it("read but not written: history is open, every change is a 403 and writes nothing", async () => {
    const entityId = await app.createNote("Groceries");
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const first = (await app.getJson<History>(`/note/${entityId}/history`)).body.versions[0]!;
    const readOnly = { "x-access": "read", "content-type": "application/json" };
    expect((await app.request(`/note/${entityId}/history`, { headers: readOnly })).status).toBe(200);
    expect((await app.request(`/note/${entityId}/clone`, { method: "POST", headers: readOnly, body: JSON.stringify({ from: first.versionId }) })).status).toBe(403);
    expect((await app.request(`/note/${entityId}/releases`, { method: "POST", headers: readOnly, body: JSON.stringify({ versionId: first.versionId }) })).status).toBe(403);
    expect((await app.request(`/note/${entityId}/branches/main/archive`, { method: "POST", headers: readOnly })).status).toBe(403);
    expect((await app.getJson<History>(`/note/${entityId}/history`)).body.versions).toHaveLength(2);
  });
});

describe("GET /:entity/:entityId/history", () => {
  it("lists every version with its label, author, time and what changed; and the branches", async () => {
    const entityId = await app.createNote("Groceries");
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    await app.editNote(entityId, { body: "eggs, bread" });

    const { status, body } = await app.getJson<History>(`/note/${entityId}/history`);
    expect(status).toBe(200);
    expect(body.versions.map((version) => version.label)).toEqual(["0.0", "0.1", "0.2"]);
    expect(body.versions[0].changes).toBeNull();
    expect(body.versions[1].changes).toEqual([{ field: "title", from: "Groceries", to: "Groceries for Sunday" }]);
    expect(body.versions[2].isHead).toBe(true);
    expect(body.versions[2].author).toEqual({ id: "u-daniel", name: "Daniel", type: "user" });
    expect(body.branches).toEqual([{ name: "main", headVersionId: body.versions[2].versionId, archivedAt: null }]);
    expect(body.releases).toEqual([]);
  });

  it("labels count from the last release on main, and by branch elsewhere", async () => {
    const entityId = await app.createNote("Groceries");
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const released = (await app.versioning.getHead(app.db, "note", entityId))!;
    expect((await app.postJson(`/note/${entityId}/releases`, { versionId: released.versionId, title: "first cut" })).status).toBe(201);
    await app.editNote(entityId, { body: "eggs" });
    app.clock.tick();
    await app.db.transaction((tx) => app.versioning.clone(tx, "note", entityId, released.versionId, daniel, { branch: "lena" }));

    const { body } = await app.getJson<History>(`/note/${entityId}/history`);
    expect(body.versions.map((version) => version.label)).toEqual(["0.0", "1.0", "1.1", "lena.0"]);
    expect(body.releases).toMatchObject([{ number: 1, versionId: released.versionId, title: "first cut" }]);
    expect(body.branches.map((branch) => branch.name)).toEqual(["main", "lena"]);
  });
});

describe("the id in the url", () => {
  it("is the entity id, not the outer capsule's own id", async () => {
    const entityId = await app.createNote("Groceries");
    const [identity] = await app.db.select({ id: outerCapsule.id }).from(outerCapsule).where(eq(outerCapsule.entityId, entityId));
    expect((await app.getJson(`/note/${entityId}/history`)).status).toBe(200);
    expect((await app.getJson(`/note/${identity.id}/history`)).status).toBe(404);
  });
});

describe("GET /:entity/:entityId", () => {
  it("is the entity as it was at a moment: the version that was the head then, and its row", async () => {
    const entityId = await app.createNote("Groceries");
    const beforeTheEdit = app.clock.tick();
    await app.editNote(entityId, { title: "Groceries for Sunday" });

    const then = await app.getJson<VersionAt>(`/note/${entityId}?at=${beforeTheEdit.toISOString()}`);
    expect(then.status).toBe(200);
    expect(then.body.row.title).toBe("Groceries");
    expect(then.body.version.label).toBe("0.0");

    const now = await app.getJson<VersionAt>(`/note/${entityId}`);
    expect(now.body.row.title).toBe("Groceries for Sunday");
  });

  it("reads another branch with ?branch=", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    app.clock.tick();
    await app.db.transaction((tx) => app.versioning.clone(tx, "note", entityId, first.versionId, daniel, { branch: "lena" }));
    const onLena = await app.getJson<VersionAt>(`/note/${entityId}?branch=lena`);
    expect(onLena.body.row.title).toBe("Groceries");
    expect(onLena.body.version.label).toBe("lena.0");
  });

  it("is 404 before the identity existed", async () => {
    const entityId = await app.createNote("Groceries");
    const { status } = await app.getJson(`/note/${entityId}?at=2020-01-01T00:00:00Z`);
    expect(status).toBe(404);
  });
});

describe("GET /:entity/:entityId/versions/:versionId", () => {
  it("reads that version and its row, also after the head moved", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!.versionId;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const { status, body } = await app.getJson<VersionAt>(`/note/${entityId}/versions/${first}`);
    expect(status).toBe(200);
    expect(body.version).toMatchObject({ versionId: first, isHead: false });
    expect(body.row).toMatchObject({ title: "Groceries" });
  });

  it("a version of another identity is a 404", async () => {
    const entityId = await app.createNote("Groceries");
    const other = await app.createNote("Chores");
    const otherHead = (await app.versioning.getHead(app.db, "note", other))!.versionId;
    expect((await app.request(`/note/${entityId}/versions/${otherHead}`)).status).toBe(404);
  });
});

describe("GET /:entity/:entityId/compare", () => {
  it("gives the stored delta between consecutive versions, and computes it between any two", async () => {
    const entityId = await app.createNote("Groceries");
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    await app.editNote(entityId, { body: "eggs" });
    const history = (await app.getJson<History>(`/note/${entityId}/history`)).body;
    const [first, second, third] = history.versions.map((version) => version.versionId);

    const consecutive = await app.getJson<Comparison>(`/note/${entityId}/compare?from=${first}&to=${second}`);
    expect(consecutive.body).toMatchObject({ stored: true, changes: [{ field: "title", from: "Groceries", to: "Groceries for Sunday" }] });

    const across = await app.getJson<Comparison>(`/note/${entityId}/compare?from=${first}&to=${third}`);
    expect(across.body.stored).toBe(false);
    expect(across.body.changes).toEqual([
      { field: "title", from: "Groceries", to: "Groceries for Sunday" },
      { field: "body", from: null, to: "eggs" },
    ]);
  });

  it("is 404 for a version of another identity, and 400 without from and to", async () => {
    const entityId = await app.createNote("Groceries");
    const otherId = await app.createNote("Chores");
    const own = (await app.versioning.getHead(app.db, "note", entityId))!.versionId;
    const other = (await app.versioning.getHead(app.db, "note", otherId))!.versionId;
    expect((await app.getJson(`/note/${entityId}/compare?from=${own}&to=${other}`)).status).toBe(404);
    expect((await app.getJson(`/note/${entityId}/compare`)).status).toBe(400);
  });
});

describe("POST /:entity/:entityId/clone", () => {
  const clone = (entityId: string, body: object, actor = "u-lena") =>
    app.request(`/note/${entityId}/clone`, { method: "POST", headers: { "Content-Type": "application/json", "x-actor": actor }, body: JSON.stringify(body) });

  it("on the version's own branch it is a restore: the old version is the next one on main, authored by who asked", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const head = (await app.versioning.getHead(app.db, "note", entityId))!;
    app.clock.tick();

    const response = await clone(entityId, { from: first.versionId, expectedHead: head.versionId, intent: { what: "back to the first", why: "Sunday is off" } });
    expect(response.status).toBe(201);
    const restored = (await response.json()) as VersionView;
    expect(restored).toMatchObject({ label: "0.2", origin: "branch", sources: [first.versionId], isHead: true, author: { id: "u-lena" }, title: "Groceries", intent: { what: "back to the first", why: "Sunday is off" } });
    expect((await app.getJson<VersionAt>(`/note/${entityId}`)).body.row.title).toBe("Groceries");
  });

  it("onto a new branch it opens the branch; main does not move", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    app.clock.tick();
    const response = await clone(entityId, { from: first.versionId, toBranch: "lena" });
    expect(response.status).toBe(201);
    expect((await response.json()) as VersionView).toMatchObject({ label: "lena.0", branch: "lena", changes: null });
    expect((await app.getJson<VersionAt>(`/note/${entityId}`)).body.row.title).toBe("Groceries for Sunday");
    expect((await app.getJson<BranchView[]>(`/note/${entityId}/branches`)).body.map((branch) => branch.name)).toEqual(["main", "lena"]);
  });

  it("is 409 when the head moved since the caller read it, and nothing is cloned", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const response = await clone(entityId, { from: first.versionId, expectedHead: first.versionId });
    expect(response.status).toBe(409);
    expect((await app.getJson<History>(`/note/${entityId}/history`)).body.versions).toHaveLength(2);
  });

  it("is 404 for a version of another identity", async () => {
    const entityId = await app.createNote("Groceries");
    const otherId = await app.createNote("Chores");
    const other = (await app.versioning.getHead(app.db, "note", otherId))!;
    expect((await clone(entityId, { from: other.versionId })).status).toBe(404);
  });
});

describe("POST /:entity/:entityId/merge", () => {
  const merge = (entityId: string, body: object) =>
    app.request(`/note/${entityId}/merge`, { method: "POST", headers: { "Content-Type": "application/json", "x-actor": "u-lena" }, body: JSON.stringify(body) });

  it("makes one new version on main from its head and the chosen values, with every source", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    app.clock.tick();
    await app.db.transaction((tx) => app.versioning.clone(tx, "note", entityId, first.versionId, daniel, { branch: "lena" }));
    const lena = (await app.versioning.getHead(app.db, "note", entityId, "lena"))!;
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const main = (await app.versioning.getHead(app.db, "note", entityId))!;
    app.clock.tick();

    const response = await merge(entityId, { sources: [main.versionId, lena.versionId], data: { body: "eggs" }, expectedHead: main.versionId });
    expect(response.status).toBe(201);
    expect((await response.json()) as VersionView).toMatchObject({ label: "0.2", origin: "merge", sources: [main.versionId, lena.versionId], isHead: true });
    expect((await app.getJson<VersionAt>(`/note/${entityId}`)).body.row).toMatchObject({ title: "Groceries for Sunday", body: "eggs" });
  });

  it("is 400 with fewer than two sources, 409 on a head that moved", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    expect((await merge(entityId, { sources: [first.versionId], data: {} })).status).toBe(400);
    await app.editNote(entityId, { title: "Groceries for Sunday" });
    const head = (await app.versioning.getHead(app.db, "note", entityId))!;
    expect((await merge(entityId, { sources: [first.versionId, head.versionId], data: {}, expectedHead: first.versionId })).status).toBe(409);
  });
});

describe("POST /:entity/:entityId/releases", () => {
  const headOf = async (entityId: string) => (await app.versioning.getHead(app.db, "note", entityId))!.versionId;
  const labelsOf = async (entityId: string) => (await app.getJson<History>(`/note/${entityId}/history`)).body.versions.map((version) => version.label);

  it("numbers a version of main, and the labels count from it", async () => {
    const entityId = await app.createNote("Groceries");
    await app.editNote(entityId, { body: "eggs" });
    const response = await app.postJson(`/note/${entityId}/releases`, { versionId: await headOf(entityId), title: "first cut", description: "for Sunday" });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ number: 1, title: "first cut", description: "for Sunday" });
    expect(await labelsOf(entityId)).toEqual(["0.0", "1.0"]);
  });

  it("the next release is the next number, and it is the only current one", async () => {
    const entityId = await app.createNote("Groceries");
    await app.postJson(`/note/${entityId}/releases`, { versionId: await headOf(entityId) });
    await app.editNote(entityId, { body: "eggs" });
    const second = await app.postJson(`/note/${entityId}/releases`, { versionId: await headOf(entityId) });
    expect(await second.json()).toMatchObject({ number: 2 });
    expect(await labelsOf(entityId)).toEqual(["1.0", "2.0"]);
    const current = await app.db.select().from(release).where(isNull(release.validTo));
    expect(current.map((row) => row.number)).toEqual([2]);
  });

  it("a version on another branch is a 400", async () => {
    const entityId = await app.createNote("Groceries");
    const head = await headOf(entityId);
    const cloned = await app.db.transaction((tx) => app.versioning.clone(tx, "note", entityId, head, daniel, { branch: "lena" }));
    expect((await app.postJson(`/note/${entityId}/releases`, { versionId: cloned!.versionId })).status).toBe(400);
  });

  it("the version already released, or one before it, is a 409", async () => {
    const entityId = await app.createNote("Groceries");
    const first = await headOf(entityId);
    await app.editNote(entityId, { body: "eggs" });
    const second = await headOf(entityId);
    await app.postJson(`/note/${entityId}/releases`, { versionId: second });
    expect((await app.postJson(`/note/${entityId}/releases`, { versionId: second })).status).toBe(409);
    expect((await app.postJson(`/note/${entityId}/releases`, { versionId: first })).status).toBe(409);
  });

  it("a version of another identity is a 404", async () => {
    const entityId = await app.createNote("Groceries");
    const other = await app.createNote("Chores");
    expect((await app.postJson(`/note/${entityId}/releases`, { versionId: await headOf(other) })).status).toBe(404);
  });
});

describe("POST /:entity/:entityId/branches/:name/archive", () => {
  const archive = (entityId: string, name: string) => app.request(`/note/${entityId}/branches/${name}/archive`, { method: "POST" });

  it("archives a branch: it still reads, and a clone onto it is 409; main is 400, an unknown branch 404", async () => {
    const entityId = await app.createNote("Groceries");
    const first = (await app.versioning.getHead(app.db, "note", entityId))!;
    app.clock.tick();
    await app.db.transaction((tx) => app.versioning.clone(tx, "note", entityId, first.versionId, daniel, { branch: "lena" }));
    app.clock.tick();

    const response = await archive(entityId, "lena");
    expect(response.status).toBe(200);
    expect(((await response.json()) as BranchView).archivedAt).not.toBeNull();
    expect((await app.getJson<VersionAt>(`/note/${entityId}?branch=lena`)).body.row.title).toBe("Groceries");
    const cloneOntoIt = await app.request(`/note/${entityId}/clone`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: first.versionId, toBranch: "lena" }) });
    expect(cloneOntoIt.status).toBe(409);
    expect((await archive(entityId, "main")).status).toBe(400);
    expect((await archive(entityId, "nobody")).status).toBe(404);
  });
});

describe("an entity the app did not version", () => {
  it("is 404 on every route", async () => {
    const entityId = await app.createNote("Groceries");
    expect((await app.getJson(`/comet/${entityId}/history`)).status).toBe(404);
    expect((await app.getJson(`/comet/${entityId}`)).status).toBe(404);
    expect((await app.getJson(`/note/${crypto.randomUUID()}/history`)).status).toBe(404);
    // ids are the app's own text ids: one that was never made is unknown, not malformed
    expect((await app.getJson(`/note/nope/history`)).status).toBe(404);
  });
});
