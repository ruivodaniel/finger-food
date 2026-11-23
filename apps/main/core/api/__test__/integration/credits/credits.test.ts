/**
 * Credits core on a REAL Postgres (PGlite, in-memory — no docker): the
 * slice's own migration applied as shipped, the real repositories, the real
 * services. What the unit tier proves with doubles, this tier proves against
 * the database's own indexes, the conditional UPDATEs and the CHECKs — the
 * invariants the design puts in the schema, not in code:
 *   - welcome once per owner, one lot per source (partial unique indexes)
 *   - charge once, refund once, per reference and lot (partial unique index)
 *   - a lot never goes below zero nor above its amount (conditional UPDATE + CHECK)
 *   - the spend order and the expiry filter in SQL
 *   - one account per owner (partial unique indexes on the two owner columns)
 */

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { createId } from "@paralleldrive/cuid2";
import { mountCreditsApi } from "@modules/credits/api";
import { creditAccount, creditLedger, creditLot } from "@modules/credits/models";
import { eq, sql } from "drizzle-orm";
import { makeEngine } from "../access-control/harness";
import { applyCreditsMigration, catalog, errors, people, silent } from "./support";

const ACME = { organizationId: "o-acme" } as const;
const NADIA = "u-nadia";
const run = (ref: string, units = 1) => ({ service: "assistant", units, ref, userId: NADIA });

describe("credits core (PGlite)", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle>;
  let credits: ReturnType<typeof mountCreditsApi>;
  const acme = async () => (await db.select().from(creditAccount).where(eq(creditAccount.organizationId, ACME.organizationId)))[0];
  const balance = async () => (await credits.services.ledger.balances(db, (await acme()).id)).platform;

  beforeAll(async () => {
    client = new PGlite();
    await applyCreditsMigration(client);
    db = drizzle(client);
    credits = mountCreditsApi({ db, createId, catalog, engine: makeEngine(), people, logger: silent, errors });
  });

  afterAll(async () => {
    await client.close();
  });

  it("welcomes an organization once — the partial unique index refuses the repeat", async () => {
    expect(await credits.welcome.organization(ACME.organizationId)).toBe(true);
    expect(await credits.welcome.organization(ACME.organizationId)).toBe(false);
    const lots = await db.select().from(creditLot).where(eq(creditLot.accountId, (await acme()).id));
    expect(lots.map((l) => [l.reason, l.amount, l.remaining, l.priority])).toEqual([["welcome", 500, 500, 1]]);
    expect(lots[0].expiresAt).not.toBeNull();
  });

  it("draws gifts before top-ups, spans lots, refuses short, and charges a reference once", async () => {
    await db.transaction((tx) => credits.services.ledger.grant(tx, { owner: ACME, reason: "top_up", amount: 1000, sourceRef: "cs_test_1" }));
    expect(await db.transaction((tx) => credits.services.ledger.grant(tx, { owner: ACME, reason: "top_up", amount: 1000, sourceRef: "cs_test_1" }))).toBeNull();

    // 102 units × 10 (the default list) = 1020: the whole welcome lot, then 520 of the top-up
    const spanning = await credits.metering.charge(ACME, run("run-1", 102));
    expect(spanning).toMatchObject({ ok: true, cost: 1020, balance: 480 });
    expect(await credits.metering.charge(ACME, run("run-1", 102))).toMatchObject({ ok: true, alreadyCharged: true, balance: 480 });
    expect(await credits.metering.charge(ACME, run("run-2", 49))).toMatchObject({ ok: false, reason: "balance", balance: 480, cost: 490 });

    const rows = await db
      .select({ lot: creditLot.reason, reason: creditLedger.reason, delta: creditLedger.delta, after: creditLedger.lotRemainingAfter })
      .from(creditLedger)
      .innerJoin(creditLot, eq(creditLot.id, creditLedger.lotId))
      .where(eq(creditLedger.ref, "run-1"))
      .orderBy(creditLot.priority);
    expect(rows).toEqual([
      { lot: "welcome", reason: "charge", delta: -500, after: 0 },
      { lot: "top_up", reason: "charge", delta: -520, after: 480 },
    ]);
  });

  it("refunds a reference once into both lots, and the database refuses a lot above its amount", async () => {
    expect(await credits.metering.refund({ ref: "run-1" })).toMatchObject({ refunded: true });
    expect(await credits.metering.refund({ ref: "run-1" })).toMatchObject({ refunded: false });
    expect(await balance()).toBe(1500);
    await expect(db.update(creditLot).set({ remaining: sql`amount + 1` }).where(eq(creditLot.reason, "welcome"))).rejects.toThrow();
  });

  it("caps a member per week through an allowance computed from the ledger", async () => {
    const { id } = await acme();
    await credits.services.allowances.set(db, { accountId: id, organizationId: ACME.organizationId, userId: NADIA, rule: { credits: 30, period: "week", unspent: "replace", services: null, createsCredits: false } });
    expect((await credits.metering.charge(ACME, run("run-3", 2))).ok).toBe(true);
    expect(await credits.metering.charge(ACME, run("run-4", 2))).toMatchObject({ ok: false, reason: "allowance", remaining: 10 });
    expect((await credits.metering.charge(ACME, { ...run("run-5", 2), userId: "u-olivia" })).ok).toBe(true);
    expect(await credits.services.allowances.forMember(db, id, NADIA)).toMatchObject({ spent: 20, remaining: 10 });
  });

  it("excludes an expired lot in SQL and writes it off on the next touch", async () => {
    const { id } = await acme();
    const before = await balance();
    const [lot] = await db
      .insert(creditLot)
      .values({ id: createId(), accountId: id, reason: "admin_grant", priority: 1, amount: 300, remaining: 300, expiresAt: new Date(Date.now() - 1000), createdAt: new Date() })
      .returning();
    expect(await balance()).toBe(before);
    await credits.services.ledger.settle(id);
    const [written] = await db.select().from(creditLedger).where(eq(creditLedger.lotId, lot.id));
    expect(written).toMatchObject({ reason: "expire", delta: -300, lotRemainingAfter: 0 });
  });

  it("prices by the assigned list and goes back to the default when it is cleared", async () => {
    await db.transaction((tx) => credits.services.ledger.setPriceList(tx, ACME, "starter"));
    expect(await credits.metering.quote(ACME, { service: "assistant", units: 2 })).toEqual({ ok: true, unitPrice: 5, cost: 10 });
    await db.transaction((tx) => credits.services.ledger.setPriceList(tx, ACME, null));
    expect(await credits.metering.quote(ACME, { service: "assistant", units: 2 })).toEqual({ ok: true, unitPrice: 10, cost: 20 });
  });

  it("takes back what is left of a source on the record, once per event, never below zero", async () => {
    const owner = { userId: "u-taken" };
    const { ledger } = credits.services;
    await db.transaction((tx) => ledger.grant(tx, { owner, reason: "top_up", amount: 100, sourceRef: "cs_take" }));
    await credits.metering.charge(owner, { service: "assistant", units: 7, ref: "run-take", userId: "u-taken" });
    expect(await db.transaction((tx) => ledger.takeBack(tx, owner, { sourceRef: "cs_take", upTo: 100, sourceEventId: "evt_take" }))).toBe(30);
    expect(await db.transaction((tx) => ledger.takeBack(tx, owner, { sourceRef: "cs_take", upTo: 100, sourceEventId: "evt_take" }))).toBe(0);
    const [lot] = await db.select().from(creditLot).where(eq(creditLot.sourceRef, "cs_take"));
    expect(lot.remaining).toBe(0);
    expect(await db.select({ reason: creditLedger.reason, delta: creditLedger.delta }).from(creditLedger).where(eq(creditLedger.ref, "evt_take"))).toEqual([{ reason: "take_back", delta: -30 }]);
  });

  it("keeps one account per owner and a personal account apart from the organization's", async () => {
    expect(await credits.welcome.user(NADIA)).toBe(true);
    expect(await credits.welcome.user(NADIA)).toBe(false);
    const before = await balance();
    expect(await credits.metering.charge({ userId: NADIA }, run("run-6", 50))).toMatchObject({ ok: true, balance: 0 });
    expect(await balance()).toBe(before);
  });

  it("refuses a second owner row for the same organization at the database", async () => {
    await expect(
      db.insert(creditAccount).values({ id: createId(), organizationId: ACME.organizationId, createdAt: new Date(), updatedAt: new Date() }),
    ).rejects.toThrow();
    await expect(db.insert(creditAccount).values({ id: createId(), createdAt: new Date(), updatedAt: new Date() })).rejects.toThrow();
  });
});
