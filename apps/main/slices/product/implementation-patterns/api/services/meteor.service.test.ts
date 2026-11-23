// Meteor service tests — the public door, creation in the active company,
// the engine's verdicts and scopes applied blind. Docker-free.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { PRIVATE, PUBLIC, type Ac } from "@libs/gated-scoped-ac";
import { MeteorService } from "./meteor.service";
import type { MeteorChargeResult } from "../shared/credits-port";
import { InMemoryMeteorRepository, testAc, testEngine, testErrors, testGatedDb, testLogger } from "../testing/in-memory-repos";

const Q = { page: 1, pageSize: 20 };
const company = { id: "org1", type: "company" };

let seq = 0;
const createId = () => `m${++seq}`;
/** no meteor is locked, and nothing is edited live */
const unlocked = { isLocked: async () => false, writeAs: () => ({}) as never };

function build(engine: Ac = testEngine) {
  const meteorRepo = new InMemoryMeteorRepository();
  /** the meteors the app says are locked */
  const locked = new Set<string>();
  const service = new MeteorService({
    meteorRepo, engine, gatedDb: testGatedDb, createId, errors: testErrors, logger: testLogger,
    isLocked: async (meteorId) => locked.has(meteorId),
    writeAs: () => ({}) as never,
  });
  return { meteorRepo, service, locked };
}

/** A service that spends credits on a clock the test moves. */
function metered(charge: MeteorChargeResult = { ok: true }) {
  const meteorRepo = new InMemoryMeteorRepository();
  const clock = { now: new Date("2026-11-09T12:00:00.000Z") };
  meteorRepo.now = () => clock.now;
  const credits = {
    charge: vi.fn(async () => charge),
    refund: vi.fn(async () => ({ refunded: true })),
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const service = new MeteorService({ meteorRepo, engine: testEngine, gatedDb: testGatedDb, ...unlocked, createId, credits, errors: testErrors, logger, now: () => clock.now });
  return { meteorRepo, service, credits, clock, logger };
}

describe("MeteorService", () => {
  let s: ReturnType<typeof build>;
  beforeEach(() => { s = build(); });

  it("creates a draft in the caller's active company, by the caller", async () => {
    const row = await s.service.create(testAc("u1", company), PRIVATE, { name: "Chelyabinsk" });
    expect(row).toMatchObject({ organizationId: "org1", createdBy: "u1", status: "draft", name: "Chelyabinsk" });
  });

  it("refuses to create without an active organization", async () => {
    await expect(s.service.create(testAc("u1", null), PRIVATE, { name: "x" })).rejects.toThrow("an active organization is required");
  });

  it("refuses to create when the engine's verdict denies", async () => {
    const denying = { ...testEngine, allowCreate: () => ({ allow: false, reason: "no" }) } as unknown as Ac;
    const d = build(denying);
    await expect(d.service.create(testAc("u1", company), PRIVATE, { name: "x" })).rejects.toThrow("no");
  });

  it("the public door serves published meteors only, with the public fields", async () => {
    const ac = testAc("u1", company);
    const draft = await s.service.create(ac, PRIVATE, { name: "Draft one" });
    const pub = await s.service.create(ac, PRIVATE, { name: "Published one" });
    await s.service.update(ac, PRIVATE, pub.id, { status: "published" });
    const list = await s.service.getPublished(PUBLIC, Q);
    expect(list.total).toBe(1);
    expect(list.rows[0]).toEqual({ id: pub.id, name: "Published one", description: null, diameterKm: null, discoveredAt: null });
    await expect(s.service.getPublishedById(PUBLIC, draft.id)).rejects.toThrow("meteor not found");
    expect((await s.service.getPublishedById(PUBLIC, pub.id)).name).toBe("Published one");
  });

  it("the company's list and detail include drafts", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A" });
    const all = await s.service.getAll(ac, PRIVATE, Q);
    expect(all.total).toBe(1);
    expect((await s.service.getById(ac, PRIVATE, a.id)).status).toBe("draft");
  });

  it("canAccess answers by the same Scopes: a row admitted, an unknown or unadmitted one not", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A" });
    expect(await s.service.canAccess(ac, PRIVATE, a.id, "read")).toBe(true);
    expect(await s.service.canAccess(ac, PRIVATE, a.id, "write")).toBe(true);
    expect(await s.service.canAccess(ac, PRIVATE, "nope", "read")).toBe(false);
    s.meteorRepo.admits = (r) => r.id !== a.id;
    expect(await s.service.canAccess(ac, PRIVATE, a.id, "read")).toBe(false);
    expect(await s.service.canAccess(ac, PRIVATE, a.id, "write")).toBe(false);
  });

  it("a row the scope does not admit is a 404 on read and forbidden on write", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A" });
    s.meteorRepo.admits = (r) => r.id !== a.id;
    await expect(s.service.getById(ac, PRIVATE, a.id)).rejects.toThrow("meteor not found");
    await expect(s.service.update(ac, PRIVATE, a.id, { name: "B" })).rejects.toThrow("cannot update meteor");
    await expect(s.service.remove(ac, PRIVATE, a.id)).rejects.toThrow("cannot remove this meteor");
  });

  it("refuses an update when the column verdict denies", async () => {
    const denying = { ...testEngine, allowUpdate: () => ({ allow: false, reason: "not these columns" }) } as unknown as Ac;
    const d = build(denying);
    const a = await d.service.create(testAc("u1", company), PRIVATE, { name: "A" });
    await expect(d.service.update(testAc("u1", company), PRIVATE, a.id, { name: "B" })).rejects.toThrow("not these columns");
  });

  it("deletes an admitted row", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A" });
    await s.service.remove(ac, PRIVATE, a.id);
    expect((await s.service.getAll(ac, PRIVATE, Q)).total).toBe(0);
  });

  it("a locked meteor isn't changed, published or deleted", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A" });
    s.locked.add(a.id);
    await expect(s.service.update(ac, PRIVATE, a.id, { name: "B" })).rejects.toThrow("this meteor is locked");
    await expect(s.service.update(ac, PRIVATE, a.id, { status: "published" })).rejects.toThrow("this meteor is locked");
    await expect(s.service.remove(ac, PRIVATE, a.id)).rejects.toThrow("this meteor is locked");
    expect((await s.service.getById(ac, PRIVATE, a.id)).name).toBe("A");
    s.locked.delete(a.id);
    expect((await s.service.update(ac, PRIVATE, a.id, { name: "B" })).name).toBe("B");
  });

  it("a live meteor: its fields and head, a checkpoint saved on behalf of its editor, its title", async () => {
    const ac = testAc("u1", company);
    const a = await s.service.create(ac, PRIVATE, { name: "A", description: "first" });
    const live = await s.service.getLiveDocument(PRIVATE, a.id);
    expect(live.document).toEqual({ name: "A", description: "first", diameterKm: null, discoveredAt: null });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const head = await s.service.saveLiveDocument(PRIVATE, a.id, { ...live.document, name: "A prime" }, "u2");
    expect(head).not.toBe(live.head);
    expect((await s.service.getLiveDocument(PRIVATE, a.id)).document.name).toBe("A prime");
    expect(await s.service.getTitles(PRIVATE, [a.id, "nope"])).toEqual(new Map([[a.id, "A prime"]]));
    await expect(s.service.getLiveDocument(PRIVATE, "nope")).rejects.toThrow("meteor not found");
  });
});

describe("MeteorService — credits", () => {
  const ac = testAc("u1", company);

  it("charges the company one meteor before the insert, under the meteor's own id", async () => {
    const s = metered();
    const row = await s.service.create(ac, PRIVATE, { name: "A" });
    expect(s.credits.charge).toHaveBeenCalledWith({ organizationId: "org1" }, { service: "meteor", units: 1, ref: row.id, userId: "u1" });
    expect(s.credits.refund).not.toHaveBeenCalled();
  });

  it.each([
    ["entitlement", /not included/],
    ["balance", /not enough credits/],
    ["allowance", /credit allocation does not cover/],
  ] as const)("a charge refused for %s is a 402 that writes nothing", async (reason, message) => {
    const s = metered({ ok: false, reason });
    await expect(s.service.create(ac, PRIVATE, { name: "A" })).rejects.toMatchObject({ kind: "paymentRequired", message: expect.stringMatching(message) });
    expect(s.meteorRepo.rows).toEqual([]);
  });

  it("does not charge when the engine denies the create", async () => {
    const s = metered();
    const denied = new MeteorService({
      meteorRepo: s.meteorRepo, engine: { ...testEngine, allowCreate: () => ({ allow: false }) } as unknown as Ac, gatedDb: testGatedDb, ...unlocked, createId, credits: s.credits, errors: testErrors, logger: testLogger,
    });
    await expect(denied.create(ac, PRIVATE, { name: "A" })).rejects.toMatchObject({ kind: "forbidden" });
    expect(s.credits.charge).not.toHaveBeenCalled();
  });

  it("gives the credits back when the insert throws, and still says why it failed", async () => {
    const s = metered();
    s.meteorRepo.create = async () => { throw new Error("insert failed"); };
    await expect(s.service.create(ac, PRIVATE, { name: "A" })).rejects.toThrow("insert failed");
    expect(s.credits.refund).toHaveBeenCalledTimes(1);
  });

  it("gives the credits back when the gate refuses the write", async () => {
    const s = metered();
    s.meteorRepo.create = async () => null;
    await expect(s.service.create(ac, PRIVATE, { name: "A" })).rejects.toThrow("cannot create meteor");
    expect(s.credits.refund).toHaveBeenCalledTimes(1);
  });

  it("logs a refund that fails and keeps the original error", async () => {
    const s = metered();
    s.meteorRepo.create = async () => { throw new Error("insert failed"); };
    s.credits.refund.mockRejectedValueOnce(new Error("ledger down"));
    await expect(s.service.create(ac, PRIVATE, { name: "A" })).rejects.toThrow("insert failed");
    expect(s.logger.error).toHaveBeenCalledWith("meteor credit refund failed", expect.objectContaining({ error: "ledger down" }));
  });

  it("refunds a delete 59 seconds after creation", async () => {
    const s = metered();
    const row = await s.service.create(ac, PRIVATE, { name: "A" });
    s.clock.now = new Date(s.clock.now.getTime() + 59_000);
    await s.service.remove(ac, PRIVATE, row.id);
    expect(s.credits.refund).toHaveBeenCalledWith({ ref: row.id });
  });

  it("does not refund a delete at exactly one minute, nor after", async () => {
    const s = metered();
    const at60 = await s.service.create(ac, PRIVATE, { name: "A" });
    const at61 = await s.service.create(ac, PRIVATE, { name: "B" });
    s.clock.now = new Date(s.clock.now.getTime() + 60_000);
    await s.service.remove(ac, PRIVATE, at60.id);
    s.clock.now = new Date(s.clock.now.getTime() + 1_000);
    await s.service.remove(ac, PRIVATE, at61.id);
    expect(s.credits.refund).not.toHaveBeenCalled();
  });

  it("does not refund a delete the scope refused", async () => {
    const s = metered();
    const row = await s.service.create(ac, PRIVATE, { name: "A" });
    s.meteorRepo.admits = () => false;
    await expect(s.service.remove(ac, PRIVATE, row.id)).rejects.toThrow("cannot remove this meteor");
    expect(s.credits.refund).not.toHaveBeenCalled();
  });

  it("is free without a credits port", async () => {
    const s = build();
    const row = await s.service.create(ac, PRIVATE, { name: "A" });
    await s.service.remove(ac, PRIVATE, row.id);
    expect(s.meteorRepo.rows).toEqual([]);
  });
});
