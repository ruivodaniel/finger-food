import { and, eq } from "drizzle-orm";
import { innerCapsule, outerCapsule, versionDelta } from "../src/index";
import { author, makeClock, makeTestDb, makeVersioning, meteor } from "./fixture/db";

type Db = Awaited<ReturnType<typeof makeTestDb>>;
let db: Db; let clock: ReturnType<typeof makeClock>; let version: ReturnType<typeof makeVersioning>;

beforeEach(async () => { db = await makeTestDb(); clock = makeClock(); version = makeVersioning(clock); });

// create = identity → the caller's insert → created
async function create(name: string, diameterKm = "1") {
  const outerId = await version.identity(db, "meteor");
  const id = crypto.randomUUID();
  await db.insert(meteor).values({ id, outerId, name, diameterKm });
  const row = await version.created(db, "meteor", id, outerId, author);
  return { outerId, row };
}
const currentRows = (view?: { branch?: string; at?: Date }) => db.select().from(meteor).where(version.current("meteor", view));

describe("create", () => {
  it("identity before, created after: one outer capsule, branch main, one first inner capsule pointing at the row", async () => {
    const { outerId, row } = await create("Ceres");
    expect(row.outerId).toBe(outerId);
    const [oc] = await db.select().from(outerCapsule);
    expect(oc.entityId).toBe(outerId); expect(oc.entityType).toBe("meteor"); expect(oc.validTo).toBeNull();
    const [ic] = await db.select().from(innerCapsule);
    expect(ic.entityRowId).toBe(row.id); expect(ic.originKind).toBe("first"); expect(ic.isMain).toBe(true); expect(ic.authorId).toBe("daniel");
  });
  it("an entity not in the map throws", async () => {
    await expect(version.identity(db, "comet" as never)).rejects.toThrow(/not in the versioned map/);
  });
});

describe("current", () => {
  it("is a WHERE fragment: one row per identity, the head of main", async () => {
    await create("Ceres"); await create("Vesta");
    expect((await currentRows()).map((r) => r.name).sort()).toEqual(["Ceres", "Vesta"]);
  });
  it("hides every older version", async () => {
    const { outerId } = await create("Ceres");
    clock.tick(); await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "Ceres (dwarf)" }, author));
    clock.tick(); await db.transaction((tx) => version.save(tx, "meteor", outerId, { diameterKm: "940" }, author));
    expect(await db.select().from(meteor)).toHaveLength(3);
    const cur = await currentRows();
    expect(cur).toHaveLength(1); expect(cur[0].name).toBe("Ceres (dwarf)"); expect(cur[0].diameterKm).toBe("940");
  });
  it("time travel: the same fragment with a moment", async () => {
    const { outerId } = await create("Ceres");
    const before = clock.tick(); clock.tick();
    await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "Ceres (dwarf)" }, author));
    expect((await currentRows({ at: before }))[0].name).toBe("Ceres");
    expect((await currentRows({ at: clock.tick() }))[0].name).toBe("Ceres (dwarf)");
    expect(await currentRows({ at: new Date("2025-01-01") })).toHaveLength(0);
  });
});

describe("save", () => {
  it("inserts a new row with the same outer id, keeps the old row, moves the head, records the delta", async () => {
    const { outerId, row: r1 } = await create("Ceres");
    clock.tick();
    const r2 = await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "Ceres (dwarf)" }, author));
    expect(r2).not.toBeNull(); expect(r2!.id).not.toBe(r1.id); expect(r2!.outerId).toBe(outerId); expect(r2!.diameterKm).toBe("1");
    const [old] = await db.select().from(meteor).where(eq(meteor.id, r1.id as string));
    expect(old.name).toBe("Ceres");
    const ics = await db.select().from(innerCapsule).where(eq(innerCapsule.outerCapsuleId, outerId));
    const head = ics.find((ic) => ic.validTo === null)!; const prev = ics.find((ic) => ic.validTo !== null)!;
    expect(head.entityRowId).toBe(r2!.id); expect(head.originKind).toBe("continuation"); expect(head.sourceVersionIds).toEqual([prev.id]);
    const [delta] = await db.select().from(versionDelta);
    expect(delta.fromInnerCapsuleId).toBe(prev.id); expect(delta.toInnerCapsuleId).toBe(head.id);
    expect(delta.fields).toEqual([{ field: "name", from: "Ceres", to: "Ceres (dwarf)" }]);
  });
  it("a patch that changes nothing makes no version and returns the current row", async () => {
    const { outerId, row } = await create("Ceres");
    const same = await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "Ceres", diameterKm: "1" }, author));
    expect(same!.id).toBe(row.id);
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
    expect(await db.select().from(versionDelta)).toHaveLength(0);
  });
  it("ignores id, outer id and undefined in the patch", async () => {
    const { outerId, row } = await create("Ceres");
    const same = await db.transaction((tx) => version.save(tx, "meteor", outerId, { id: "x", outerId: "y", name: undefined }, author));
    expect(same!.id).toBe(row.id);
  });
  it("null for an unknown or removed identity", async () => {
    expect(await db.transaction((tx) => version.save(tx, "meteor", "nope", { name: "x" }, author))).toBeNull();
    const { outerId } = await create("Ceres");
    await db.transaction((tx) => version.remove(tx, "meteor", outerId));
    expect(await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "x" }, author))).toBeNull();
  });
  it("is atomic in the caller's tx: a failure after the row leaves no row and no capsule", async () => {
    const { outerId } = await create("Ceres");
    clock.tick();
    await expect(db.transaction(async (tx) => { await version.save(tx, "meteor", outerId, { name: "Ceres (dwarf)" }, author); throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await db.select().from(meteor)).toHaveLength(1);
    expect(await db.select().from(innerCapsule)).toHaveLength(1);
  });
});

describe("remove", () => {
  it("closes the outer capsule and the open inner capsules; no entity row touched; reads drop it", async () => {
    const { outerId, row } = await create("Ceres");
    clock.tick();
    expect(await db.transaction((tx) => version.remove(tx, "meteor", outerId))).toBe(true);
    const [oc] = await db.select().from(outerCapsule); expect(oc.validTo).not.toBeNull();
    const [ic] = await db.select().from(innerCapsule); expect(ic.validTo).not.toBeNull();
    const [r] = await db.select().from(meteor).where(eq(meteor.id, row.id as string)); expect(r.name).toBe("Ceres");
    expect(await currentRows()).toHaveLength(0);
  });
  it("false when there is nothing to close", async () => {
    const { outerId } = await create("Ceres");
    await db.transaction((tx) => version.remove(tx, "meteor", outerId));
    expect(await db.transaction((tx) => version.remove(tx, "meteor", outerId))).toBe(false);
    expect(await db.transaction((tx) => version.remove(tx, "meteor", "nope"))).toBe(false);
  });
  it("a read before the removal still returns it", async () => {
    const { outerId } = await create("Ceres");
    const before = clock.tick(); clock.tick();
    await db.transaction((tx) => version.remove(tx, "meteor", outerId));
    expect(await currentRows({ at: before })).toHaveLength(1);
    expect(await currentRows()).toHaveLength(0);
  });
});

describe("the fragment composes", () => {
  it("ANDs with the caller's own WHERE, the scope's place", async () => {
    const { outerId } = await create("Ceres"); await create("Vesta");
    clock.tick(); await db.transaction((tx) => version.save(tx, "meteor", outerId, { name: "Ceres (dwarf)" }, author));
    const rows = await db.select().from(meteor).where(and(eq(meteor.outerId, outerId), version.current("meteor")));
    expect(rows).toHaveLength(1); expect(rows[0].name).toBe("Ceres (dwarf)");
  });
});
