import { beforeEach, describe, expect, it } from "vitest";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { BranchArchived, StaleHead } from "../src/index";
import { innerCapsule, outerCapsule, versionDelta } from "./fixture/capsules";
import { author, makeClock, makeTestDb, makeVersioning, meteor } from "./fixture/db";

type Db = Awaited<ReturnType<typeof makeTestDb>>;
let db: Db; let clock: ReturnType<typeof makeClock>; let versioning: ReturnType<typeof makeVersioning>;

beforeEach(async () => { db = await makeTestDb(); clock = makeClock(); versioning = makeVersioning(clock); });

// createMeteor = identity → the caller's insert → created
async function createMeteor(name: string, diameterKm = "1") {
  const entityId = await versioning.createOuterCapsule(db, "meteor");
  const id = crypto.randomUUID();
  await db.insert(meteor).values({ id, name, diameterKm });
  const row = await versioning.createFirstInnerCapsule(db, "meteor", id, entityId, author);
  return { entityId, row };
}
/** The versions of an entity: versions point at the outer capsule's own id, not at the entity id. */
const isVersionOf = (entityId: string) => inArray(innerCapsule.outerCapsuleId, db.select({ id: outerCapsule.id }).from(outerCapsule).where(eq(outerCapsule.entityId, entityId)));
const readCurrentRows = (view?: { branch?: string; at?: Date }) => db.select().from(meteor).where(versioning.whereCurrent("meteor", view));

describe("create", () => {
  it("identity before, created after: one outer capsule, branch main, one first inner capsule pointing at the row", async () => {
    const { entityId, row } = await createMeteor("Ceres");
    expect(await versioning.findEntityIdsOfRows(db, "meteor", [row.id])).toEqual(new Map([[row.id, entityId]]));
    const [outerRow] = await db.select().from(outerCapsule);
    expect(outerRow.entityId).toBe(entityId); expect(outerRow.id).not.toBe(entityId); expect(outerRow.entityType).toBe("meteor"); expect(outerRow.validTo).toBeNull();
    const [versionRow] = await db.select().from(innerCapsule);
    expect(versionRow.outerCapsuleId).toBe(outerRow.id);
    expect(versionRow.entityRowId).toBe(row.id); expect(versionRow.originKind).toBe("first"); expect(versionRow.isMain).toBe(true); expect(versionRow.authorId).toBe("daniel");
  });
  it("an entity id belongs to one outer capsule", async () => {
    const { entityId } = await createMeteor("Ceres");
    const time = clock.now();
    await expect(db.insert(outerCapsule).values({ id: crypto.randomUUID(), entityId, entityType: "meteor", createdAt: time, validFrom: time })).rejects.toThrow();
  });
  it("an entity not in the list throws", async () => {
    await expect(versioning.createOuterCapsule(db, "comet" as never)).rejects.toThrow(/not in the versioned list/);
  });
});

describe("current", () => {
  it("is a WHERE fragment: one row per identity, the head of main", async () => {
    await createMeteor("Ceres"); await createMeteor("Vesta");
    expect((await readCurrentRows()).map((row) => row.name).sort()).toEqual(["Ceres", "Vesta"]);
  });
  it("hides every older version", async () => {
    const { entityId } = await createMeteor("Ceres");
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author));
    expect(await db.select().from(meteor)).toHaveLength(3);
    const currentRow = await readCurrentRows();
    expect(currentRow).toHaveLength(1); expect(currentRow[0].name).toBe("Ceres (dwarf)"); expect(currentRow[0].diameterKm).toBe("940");
  });
  it("time travel: the same fragment with a moment", async () => {
    const { entityId } = await createMeteor("Ceres");
    const before = clock.tick(); clock.tick();
    await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    expect((await readCurrentRows({ at: before }))[0].name).toBe("Ceres");
    expect((await readCurrentRows({ at: clock.tick() }))[0].name).toBe("Ceres (dwarf)");
    expect(await readCurrentRows({ at: new Date("2025-01-01") })).toHaveLength(0);
  });
});

describe("save", () => {
  it("inserts a new row with the same outer id, keeps the old row, moves the head, records the delta", async () => {
    const { entityId, row: firstRow } = await createMeteor("Ceres");
    clock.tick();
    const savedRow = await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    expect(savedRow).not.toBeNull(); expect(savedRow!.id).not.toBe(firstRow.id); expect(savedRow!.diameterKm).toBe("1");
    const [old] = await db.select().from(meteor).where(eq(meteor.id, firstRow.id as string));
    expect(old.name).toBe("Ceres");
    const versionRows = await db.select().from(innerCapsule).where(isVersionOf(entityId));
    const head = versionRows.find((versionRow) => versionRow.validTo === null)!; const previous = versionRows.find((versionRow) => versionRow.validTo !== null)!;
    expect(head.entityRowId).toBe(savedRow!.id); expect(head.originKind).toBe("continuation"); expect(head.sourceVersionIds).toEqual([previous.id]);
    const [delta] = await db.select().from(versionDelta);
    expect(delta.fromInnerCapsuleId).toBe(previous.id); expect(delta.toInnerCapsuleId).toBe(head.id);
    expect(delta.fields).toEqual([{ field: "name", from: "Ceres", to: "Ceres (dwarf)" }]);
  });
  it("a patch that changes nothing makes no version and returns the current row", async () => {
    const { entityId, row } = await createMeteor("Ceres");
    const same = await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres", diameterKm: "1" }, author));
    expect(same!.id).toBe(row.id);
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
    expect(await db.select().from(versionDelta)).toHaveLength(0);
  });
  it("ignores id and undefined in the patch", async () => {
    const { entityId, row } = await createMeteor("Ceres");
    const same = await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { id: "x", name: undefined }, author));
    expect(same!.id).toBe(row.id);
  });
  it("null for an unknown or removed identity", async () => {
    expect(await db.transaction((tx) => versioning.save(tx, "meteor", "nope", { name: "x" }, author))).toBeNull();
    const { entityId } = await createMeteor("Ceres");
    await db.transaction((tx) => versioning.remove(tx, "meteor", entityId));
    expect(await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "x" }, author))).toBeNull();
  });
  it("is atomic in the caller's tx: a failure after the row leaves no row and no capsule", async () => {
    const { entityId } = await createMeteor("Ceres");
    clock.tick();
    await expect(db.transaction(async (tx) => { await versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author); throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await db.select().from(meteor)).toHaveLength(1);
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
  });
});

describe("remove", () => {
  it("closes the outer capsule and the open inner capsules; no entity row touched; reads drop it", async () => {
    const { entityId, row } = await createMeteor("Ceres");
    clock.tick();
    expect(await db.transaction((tx) => versioning.remove(tx, "meteor", entityId))).toBe(true);
    const [outerRow] = await db.select().from(outerCapsule); expect(outerRow.validTo).not.toBeNull();
    const [versionRow] = await db.select().from(innerCapsule); expect(versionRow.validTo).not.toBeNull();
    const [storedRow] = await db.select().from(meteor).where(eq(meteor.id, row.id as string)); expect(storedRow.name).toBe("Ceres");
    expect(await readCurrentRows()).toHaveLength(0);
  });
  it("false when there is nothing to close", async () => {
    const { entityId } = await createMeteor("Ceres");
    await db.transaction((tx) => versioning.remove(tx, "meteor", entityId));
    expect(await db.transaction((tx) => versioning.remove(tx, "meteor", entityId))).toBe(false);
    expect(await db.transaction((tx) => versioning.remove(tx, "meteor", "nope"))).toBe(false);
  });
  it("a read before the removal still returns it", async () => {
    const { entityId } = await createMeteor("Ceres");
    const before = clock.tick(); clock.tick();
    await db.transaction((tx) => versioning.remove(tx, "meteor", entityId));
    expect(await readCurrentRows({ at: before })).toHaveLength(1);
    expect(await readCurrentRows()).toHaveLength(0);
  });
});

describe("the fragment composes", () => {
  it("ANDs with the caller's own WHERE, the scope's place", async () => {
    const { entityId } = await createMeteor("Ceres"); await createMeteor("Vesta", "2");
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    const rows = await db.select().from(meteor).where(and(eq(meteor.diameterKm, "1"), versioning.whereCurrent("meteor")));
    expect(rows).toHaveLength(1); expect(rows[0].name).toBe("Ceres (dwarf)");
  });
  it("narrows to some identities", async () => {
    const { entityId } = await createMeteor("Ceres"); await createMeteor("Vesta");
    const rows = await db.select().from(meteor).where(versioning.whereCurrent("meteor", { entityIds: [entityId] }));
    expect(rows.map((row) => row.name)).toEqual(["Ceres"]);
  });
});

describe("seq, the branch lock and expectedHead", () => {
  const readHeads = (entityId: string) => db.select().from(innerCapsule).where(and(isVersionOf(entityId), isNull(innerCapsule.validTo)));
  const readSeqs = async (entityId: string) => (await db.select().from(innerCapsule).where(isVersionOf(entityId))).map((versionRow) => versionRow.seq).sort();

  it("seq counts the versions of a branch from 0, each identity on its own", async () => {
    const { entityId: ceres } = await createMeteor("Ceres");
    const { entityId: vesta } = await createMeteor("Vesta");
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", ceres, { name: "Ceres (dwarf)" }, author));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", ceres, { diameterKm: "940" }, author));
    expect(await readSeqs(ceres)).toEqual([0, 1, 2]);
    expect(await readSeqs(vesta)).toEqual([0]);
    expect((await versioning.getHead(db, "meteor", ceres))!.seq).toBe(2);
  });

  it("a save that changes nothing takes no seq", async () => {
    const { entityId } = await createMeteor("Ceres");
    await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres" }, author));
    expect(await readSeqs(entityId)).toEqual([0]);
  });

  // PGlite runs one transaction at a time, so this checks the outcome (one head, seq 1 and 2, no change lost), not the
  // branch lock itself: it passes without the lock too. The lock (select … for update) matters on a real Postgres with
  // several connections; proving it needs one (README, step 3).
  it("two saves at the same moment on one branch: seq 1 and 2, one head, the second made from the first", async () => {
    const { entityId } = await createMeteor("Ceres");
    clock.tick();
    await Promise.all([
      db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author)),
      db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author)),
    ]);
    const versionRows = await db.select().from(innerCapsule).where(isVersionOf(entityId));
    expect(versionRows.map((versionRow) => versionRow.seq).sort()).toEqual([0, 1, 2]);
    expect(await readHeads(entityId)).toHaveLength(1);
    const one = versionRows.find((versionRow) => versionRow.seq === 1)!, two = versionRows.find((versionRow) => versionRow.seq === 2)!;
    expect(two.sourceVersionIds).toEqual([one.id]);
    const currentRow = await readCurrentRows();
    expect(currentRow[0].name).toBe("Ceres (dwarf)"); expect(currentRow[0].diameterKm).toBe("940");   // neither save lost the other's change
  });

  it("the database refuses two versions with the same seq on one branch", async () => {
    const { entityId } = await createMeteor("Ceres");
    const [versionRow] = await db.select().from(innerCapsule).where(isVersionOf(entityId));
    await expect(db.insert(innerCapsule).values({ ...versionRow, id: "dup", validTo: new Date() })).rejects.toThrow();
  });

  it("a save on the head it expects goes through", async () => {
    const { entityId } = await createMeteor("Ceres");
    const head = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick();
    const row = await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author, { expectedHead: head.versionId }));
    expect(row!.name).toBe("Ceres (dwarf)");
    expect((await versioning.getHead(db, "meteor", entityId))!.seq).toBe(1);
  });

  it("a save on a head that moved is refused with StaleHead, and nothing of it is kept", async () => {
    const { entityId } = await createMeteor("Ceres");
    const seen = (await versioning.getHead(db, "meteor", entityId))!;            // Lena's tab read firstVersion
    clock.tick();
    await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));   // Daniel saved first: renamedVersion
    const now = (await versioning.getHead(db, "meteor", entityId))!;
    const error = await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author, { expectedHead: seen.versionId })).catch((thrown) => thrown);
    expect(error).toBeInstanceOf(StaleHead);
    expect(error.expected).toBe(seen.versionId); expect(error.head).toBe(now.versionId);
    expect(await db.select().from(meteor)).toHaveLength(2);                 // no third row
    expect(await readSeqs(entityId)).toEqual([0, 1]);
    expect((await readCurrentRows())[0].diameterKm).toBe("1");
  });

  it("a stale save is refused even when it changes nothing: the caller's view is old", async () => {
    const { entityId } = await createMeteor("Ceres");
    const seen = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    await expect(db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author, { expectedHead: seen.versionId }))).rejects.toBeInstanceOf(StaleHead);
  });

  it("head is nothing for an unknown identity, and save on an unknown branch is null", async () => {
    expect(await versioning.getHead(db, "meteor", "nope")).toBeNull();
    const { entityId } = await createMeteor("Ceres");
    expect(await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "x" }, author, { branch: "lena" }))).toBeNull();
  });
});

describe("clone, archive, merge", () => {
  const readVersionsOf = (entityId: string) => db.select().from(innerCapsule).where(isVersionOf(entityId));
  const readDeltaInto = async (versionId: string) => (await db.select().from(versionDelta).where(eq(versionDelta.toInnerCapsuleId, versionId)))[0];

  it("a clone on the version's own branch is a restore: its row becomes the next version; history kept", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    const renamedVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick();
    const restoredVersion = await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { expectedHead: renamedVersion.versionId }));
    expect(restoredVersion!.seq).toBe(2);
    expect((await readCurrentRows())[0].name).toBe("Ceres");
    expect(await readVersionsOf(entityId)).toHaveLength(3);
    const restored = (await readVersionsOf(entityId)).find((candidate) => candidate.id === restoredVersion!.versionId)!;
    expect(restored.originKind).toBe("branch"); expect(restored.sourceVersionIds).toEqual([firstVersion.versionId]);
    const delta = await readDeltaInto(restoredVersion!.versionId);
    expect(delta.fromInnerCapsuleId).toBe(renamedVersion.versionId);
    expect(delta.fields).toEqual([{ field: "name", from: "Ceres (dwarf)", to: "Ceres" }]);
  });

  it("a clone onto a new branch opens it at seq 0, with no delta; main does not move; the branch then lives on its own", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    const mainHead = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick();
    const lena = await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, { id: "lena", type: "user" }, { branch: "lena" }));
    expect(lena!.seq).toBe(0);
    const first = (await readVersionsOf(entityId)).find((candidate) => candidate.id === lena!.versionId)!;
    expect(first.originKind).toBe("branch"); expect(first.isMain).toBe(false); expect(first.sourceVersionIds).toEqual([firstVersion.versionId]);
    expect((await versioning.getHead(db, "meteor", entityId))!.versionId).toBe(mainHead.versionId);
    expect((await readCurrentRows())[0].name).toBe("Ceres (dwarf)");
    expect((await readCurrentRows({ branch: "lena" }))[0].name).toBe("Ceres");
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author, { branch: "lena" }));
    expect((await versioning.getHead(db, "meteor", entityId, "lena"))!.seq).toBe(1);
    expect((await readCurrentRows())[0].diameterKm).toBe("1");
    expect(await readDeltaInto(lena!.versionId)).toBeUndefined();
  });

  it("a clone onto a branch that exists becomes its next version", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { branch: "lena" }));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    const mainHead = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick();
    const cloned = await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, mainHead.versionId, author, { branch: "lena" }));
    expect(cloned!.seq).toBe(1);
    expect((await readCurrentRows({ branch: "lena" }))[0].name).toBe("Ceres (dwarf)");
  });

  it("an archived branch keeps its versions and takes no more; main cannot be archived", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { branch: "lena" }));
    clock.tick();
    expect(await db.transaction((tx) => versioning.archiveBranch(tx, entityId, "lena"))).toBe(true);
    expect(await db.transaction((tx) => versioning.archiveBranch(tx, entityId, "lena"))).toBe(false);
    expect((await readCurrentRows({ branch: "lena" }))[0].name).toBe("Ceres");
    await expect(db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { branch: "lena" }))).rejects.toBeInstanceOf(BranchArchived);
    expect(await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "x" }, author, { branch: "lena" }))).toBeNull();
    await expect(db.transaction((tx) => versioning.archiveBranch(tx, entityId, "main"))).rejects.toThrow(/main cannot be archived/);
  });

  it("merge: the head's row plus the chosen values becomes the next version on main, with every source", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { branch: "lena" }));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author, { branch: "lena" }));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    const main = (await versioning.getHead(db, "meteor", entityId))!, lena = (await versioning.getHead(db, "meteor", entityId, "lena"))!;
    clock.tick();
    const row = await db.transaction((tx) => versioning.merge(tx, "meteor", entityId, { diameterKm: "940" }, [main.versionId, lena.versionId], author, { expectedHead: main.versionId }));
    expect(row!.name).toBe("Ceres (dwarf)"); expect(row!.diameterKm).toBe("940");
    const merged = (await versioning.getHead(db, "meteor", entityId))!;
    expect(merged.seq).toBe(2);
    const mergedVersion = (await readVersionsOf(entityId)).find((candidate) => candidate.id === merged.versionId)!;
    expect(mergedVersion.originKind).toBe("merge"); expect(mergedVersion.sourceVersionIds).toEqual([main.versionId, lena.versionId]); expect(mergedVersion.isMain).toBe(true);
    expect((await versioning.getHead(db, "meteor", entityId, "lena"))!.versionId).toBe(lena.versionId);   // lena keeps its head
  });

  it("merge needs two sources or more, all versions of this identity", async () => {
    const { entityId } = await createMeteor("Ceres");
    const { entityId: vesta } = await createMeteor("Vesta");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!, other = (await versioning.getHead(db, "meteor", vesta))!;
    await expect(db.transaction((tx) => versioning.merge(tx, "meteor", entityId, { name: "x" }, [firstVersion.versionId], author))).rejects.toThrow(/at least two/);
    await expect(db.transaction((tx) => versioning.merge(tx, "meteor", entityId, { name: "x" }, [firstVersion.versionId, other.versionId], author))).rejects.toThrow(/not a version of/);
  });

  it("a clone uses only the identity's own versions", async () => {
    const { entityId } = await createMeteor("Ceres");
    const { entityId: vesta } = await createMeteor("Vesta");
    const other = (await versioning.getHead(db, "meteor", vesta))!;
    await expect(db.transaction((tx) => versioning.clone(tx, "meteor", entityId, other.versionId, author))).rejects.toThrow(/not a version of/);
    await expect(db.transaction((tx) => versioning.clone(tx, "meteor", entityId, other.versionId, author, { branch: "lena" }))).rejects.toThrow(/not a version of/);
  });

  it("a clone on a head that moved is refused; nothing is done for an identity that is not alive", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    await expect(db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { expectedHead: firstVersion.versionId }))).rejects.toBeInstanceOf(StaleHead);
    await db.transaction((tx) => versioning.remove(tx, "meteor", entityId));
    expect(await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author))).toBeNull();
  });

  it("version reads one version and its row; nothing for an unknown version", async () => {
    const { entityId, row } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    const found = await versioning.getVersion(db, "meteor", firstVersion.versionId);
    expect(found!.version.seq).toBe(0); expect(found!.row.id).toBe(row.id); expect(found!.row.name).toBe("Ceres");
    expect(await versioning.getVersion(db, "meteor", "nope")).toBeNull();
  });
});

describe("what a version records about itself", () => {
  it("who made it, on whose behalf, in which workflow and model; why; and its title and slug from its row", async () => {
    const agent = { id: "claude", type: "agent", instructedBy: "daniel", workflowId: "w1", modelVersion: "m1" } as const;
    const { entityId } = await createMeteor("Ceres");
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, agent, { intent: { what: "rename", why: "the IAU said so" } }));
    const head = (await versioning.getHead(db, "meteor", entityId))!;
    const [version] = await db.select().from(innerCapsule).where(eq(innerCapsule.id, head.versionId));
    expect(version).toMatchObject({ authorId: "claude", authorType: "agent", instructedById: "daniel", authorWorkflowId: "w1", authorModelVersion: "m1", title: "Ceres (dwarf)", slug: "ceres (dwarf)", intentWhat: "rename", intentWhy: "the IAU said so" });
  });

  it("a slug is unique per entity among the heads of main; other branches and older versions may repeat it", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    await db.transaction((tx) => versioning.clone(tx, "meteor", entityId, firstVersion.versionId, author, { branch: "lena" }));   // the same slug on another branch
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Vesta" }, author));
    await createMeteor("Ceres");                                                                                    // the slug is free on main again
    await expect(createMeteor("Vesta")).rejects.toThrow();
  });
});

describe("the delta hook", () => {
  it("an entity's own delta is what a new version stores; without one, one entry per changed column", async () => {
    const own = makeVersioning(clock, (from, to) => (from.name === to.name ? [] : [{ field: "renamed", from: from.name, to: to.name }]));
    const entityId = await own.createOuterCapsule(db, "meteor");
    const id = crypto.randomUUID();
    await db.insert(meteor).values({ id, name: "Ceres", diameterKm: "1" });
    await own.createFirstInnerCapsule(db, "meteor", id, entityId, author);
    clock.tick(); await db.transaction((tx) => own.save(tx, "meteor", entityId, { name: "Ceres (dwarf)", diameterKm: "940" }, author));
    const [delta] = await db.select().from(versionDelta);
    expect(delta.fields).toEqual([{ field: "renamed", from: "Ceres", to: "Ceres (dwarf)" }]);   // the hook's, not the columns'
  });
});

describe("hasEntity and compareVersions", () => {
  it("hasEntity says whether an entity is in the versioned list", () => {
    expect(versioning.hasEntity("meteor")).toBe(true);
    expect(versioning.hasEntity("comet")).toBe(false);
    expect(versioning.hasEntity("toString")).toBe(false);
  });

  it("compareVersions gives what changed between any two versions, not only consecutive ones", async () => {
    const { entityId } = await createMeteor("Ceres");
    const firstVersion = (await versioning.getHead(db, "meteor", entityId))!;
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { name: "Ceres (dwarf)" }, author));
    clock.tick(); await db.transaction((tx) => versioning.save(tx, "meteor", entityId, { diameterKm: "940" }, author));
    const lastVersion = (await versioning.getHead(db, "meteor", entityId))!;
    expect(await versioning.compareVersions(db, "meteor", firstVersion.versionId, lastVersion.versionId)).toEqual([
      { field: "name", from: "Ceres", to: "Ceres (dwarf)" },
      { field: "diameterKm", from: "1", to: "940" },
    ]);
    expect(await versioning.compareVersions(db, "meteor", firstVersion.versionId, "nope")).toBeNull();
  });
});
