/**
 * The ledger against the in-memory repositories: entitlement and price, the
 * spend order across lots, the lazy expiry, refunds into their lots, grants,
 * welcome, take-back and a member's weekly allocation. The UC numbers are the design's use cases.
 */

import { describe, expect, it, vi } from "vitest";
import { LedgerService } from "./ledger.service";
import { AllowanceService, periodStart } from "./allowance.service";
import { CreditAccountService } from "./credit-account.service";
import {
  InMemoryCreditAccountRepository,
  InMemoryCreditLedgerRepository,
  InMemoryCreditLotRepository,
  InMemoryMemberAllowanceRepository,
  FAKE_TX,
  NO_ENGINE,
  fakePeople,
  nextId,
  runInFakeTransaction,
  silentLogger,
  testErrors,
} from "../testing/in-memory-repos";
import type { LotReason } from "../../shared/types";
import type { CreditsCatalog } from "../../shared/catalog";

const ACME = { organizationId: "o-acme" } as const;
const BOREALIS = "o-borealis";
const NADIA = "u-nadia";
const run = (ref: string, units = 1, service = "assistant") => ({ service, units, ref, userId: NADIA });
const weekly = (credits: number) => ({ credits, period: "week", unspent: "replace", services: null, createsCredits: false }) as const;

const catalog: CreditsCatalog = {
  currency: "eur",
  services: [
    { key: "assistant", name: "Assistant", unit: "question" },
    { key: "mastering", name: "Mastering", unit: "track" },
  ],
  defaultPriceList: "free",
  priceLists: {
    free: { assistant: 10 },
    starter: { assistant: 5 },
    pro: { assistant: 0, mastering: 200 },
  },
  welcome: { user: 500, organization: 500, expiresInDays: 180 },
};

function stack() {
  const accountRepo = new InMemoryCreditAccountRepository();
  const lotRepo = new InMemoryCreditLotRepository();
  const ledgerRepo = new InMemoryCreditLedgerRepository(lotRepo);
  const allowanceRepo = new InMemoryMemberAllowanceRepository();
  const allowances = new AllowanceService({ allowanceRepo, ledgerRepo, createId: nextId });
  const ledger = new LedgerService({
    accountRepo, lotRepo, ledgerRepo, allowances, catalog, db: FAKE_TX, runInTransaction: runInFakeTransaction, createId: nextId, logger: silentLogger,
  });
  const accounts = new CreditAccountService({
    accountRepo, lotRepo, ledgerRepo, ledger, allowances, catalog, engine: NO_ENGINE, db: FAKE_TX,
    runInTransaction: runInFakeTransaction, createId: nextId, errors: testErrors, people: fakePeople(),
  });
  return { accountRepo, lotRepo, ledgerRepo, allowanceRepo, allowances, ledger, accounts };
}

type Stack = ReturnType<typeof stack>;

/** Acme's account on a price list (null = the default). */
async function acme(s: Stack, priceList: string | null = "starter") {
  const account = await s.accounts.ensure(FAKE_TX, ACME);
  if (priceList) await s.ledger.setPriceList(FAKE_TX, ACME, priceList);
  return account;
}

const lot = (s: Stack, reason: LotReason, amount: number, expiresAt: string | null = null, vendorOrganizationId: string | null = null) =>
  s.ledger.grant(FAKE_TX, { owner: ACME, reason, amount, expiresAt: expiresAt ? new Date(expiresAt) : null, vendorOrganizationId });

/** The rows a reference wrote: [lot reason, ledger reason, delta, lot after]. */
const rowsOf = (s: Stack, ref: string) =>
  s.ledgerRepo.rows.filter((r) => r.ref === ref).map((r) => [s.lotRepo.rows.find((l) => l.id === r.lotId)!.reason, r.reason, r.delta, r.lotRemainingAfter]);

describe("charge — entitlement and price", () => {
  it("charges units times the list's price and names the service on the row (UC105, UC109)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    const r = await s.ledger.charge(ACME, run("run-1", 3));
    expect(r).toMatchObject({ ok: true, cost: 15, balance: 1985, alreadyCharged: false });
    expect(s.ledgerRepo.rows.filter((x) => x.reason === "charge").map((x) => [x.serviceKey, x.userId, x.delta])).toEqual([["assistant", NADIA, -15]]);
  });

  it("refuses a service outside the list before anything moves (UC106)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    expect(await s.ledger.charge(ACME, run("run-2", 1, "mastering"))).toMatchObject({ ok: false, reason: "entitlement", service: "mastering" });
    expect(rowsOf(s, "run-2")).toEqual([]);
  });

  it("charges the default list's price with none assigned, and refuses what it leaves out (UC108, UC138)", async () => {
    const s = stack();
    await acme(s, null);
    await lot(s, "welcome", 500, "2026-07-01T00:00:00Z");
    expect(await s.ledger.charge(ACME, run("run-3"))).toMatchObject({ ok: true, cost: 10 });
    expect(await s.ledger.charge(ACME, run("run-4", 1, "mastering"))).toMatchObject({ ok: false, reason: "entitlement" });
  });

  it("runs a service the list includes at no cost without a charge row (UC111)", async () => {
    const s = stack();
    await acme(s, "pro");
    await lot(s, "plan", 6000, "2026-03-02T09:00:00Z");
    expect(await s.ledger.charge(ACME, run("run-5"))).toMatchObject({ ok: true, cost: 0, balance: 6000 });
    expect(rowsOf(s, "run-5")).toEqual([]);
  });

  it("quotes the cost before the action, or the entitlement refusal", async () => {
    const s = stack();
    await acme(s);
    expect(await s.ledger.quote(ACME, { service: "assistant", units: 4 })).toEqual({ ok: true, unitPrice: 5, cost: 20 });
    expect(await s.ledger.quote(ACME, { service: "mastering", units: 1 })).toEqual({ ok: false, reason: "entitlement" });
    expect(await s.ledger.quote({ userId: "u-nobody" }, { service: "assistant", units: 1 })).toEqual({ ok: true, unitPrice: 10, cost: 10 });
  });

  it("goes back to the default list when the assignment is cleared", async () => {
    const s = stack();
    await acme(s);
    await s.ledger.setPriceList(FAKE_TX, ACME, null);
    expect(await s.ledger.quote(ACME, { service: "assistant", units: 1 })).toEqual({ ok: true, unitPrice: 10, cost: 10 });
  });

  it("knows which price lists exist", () => {
    const s = stack();
    expect(s.ledger.hasPriceList("pro")).toBe(true);
    expect(s.ledger.hasPriceList("enterprise")).toBe(false);
  });
});

describe("charge — spend order", () => {
  it("spends gifts, then the plan's credits, then top-ups (UC123, UC30, UC31)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "top_up", 1000);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    await lot(s, "admin_grant", 10, "2026-03-16T00:00:00Z");
    const r = await s.ledger.charge(ACME, { ...run("run-6"), units: 4 }); // 20 cents: 10 from the grant, 10 from the plan
    expect(r).toMatchObject({ ok: true, cost: 20, balance: 2990 });
    expect(rowsOf(s, "run-6")).toEqual([
      ["admin_grant", "charge", -10, 0],
      ["plan", "charge", -10, 1990],
    ]);
  });

  it("between two gifts, spends the one expiring sooner first (UC124)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "admin_grant", 2000, "2026-03-16T00:00:00Z");
    await lot(s, "welcome", 500, "2026-03-01T00:00:00Z");
    await s.ledger.charge(ACME, run("run-7"));
    expect(rowsOf(s, "run-7")).toEqual([["welcome", "charge", -5, 495]]);
  });

  it("refuses for balance and moves nothing when the live lots fall short (UC28)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "top_up", 4);
    expect(await s.ledger.charge(ACME, run("run-8"))).toMatchObject({ ok: false, reason: "balance", balance: 4, cost: 5 });
    expect(rowsOf(s, "run-8")).toEqual([]);
  });

  it("never draws on vendor credits for a platform service (UC132)", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "vendor_refund", 4900, "2026-08-17T00:00:00Z", BOREALIS);
    expect(await s.ledger.charge(ACME, run("run-9"))).toMatchObject({ ok: false, reason: "balance", balance: 0 });
    expect(await s.ledger.balances(FAKE_TX, a.id)).toEqual({ platform: 0, limited: [], vendors: [{ vendorOrganizationId: BOREALIS, amount: 4900 }] });
  });

  it("charges a reference once — a retry answers done without moving anything (UC49)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "top_up", 100);
    await s.ledger.charge(ACME, run("run-10"));
    expect(await s.ledger.charge(ACME, run("run-10"))).toMatchObject({ ok: true, alreadyCharged: true, cost: 5, balance: 95 });
    expect(rowsOf(s, "run-10")).toHaveLength(1);
  });

  it("creates the account on the first charge of an unknown owner and refuses for balance", async () => {
    const s = stack();
    expect(await s.ledger.charge({ userId: "u-new" }, { service: "assistant", units: 1, ref: "run-11", userId: "u-new" })).toMatchObject({ ok: false, reason: "balance" });
    expect(await s.accountRepo.findByOwner(FAKE_TX, { userId: "u-new" })).not.toBeNull();
  });
});

describe("lazy expiry", () => {
  it("drops an expired lot from the balance before any row is written (UC114)", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "welcome", 500, "2026-02-20T00:00:00Z");
    expect((await s.ledger.balances(FAKE_TX, a.id)).platform).toBe(500);
    vi.setSystemTime(new Date("2026-02-20T00:00:00Z"));
    expect((await s.ledger.balances(FAKE_TX, a.id)).platform).toBe(0);
    expect(s.ledgerRepo.rows.map((r) => r.reason)).toEqual(["grant"]);
  });

  it("writes one expire row at the next touch, and only once (UC115)", async () => {
    const s = stack();
    const a = await acme(s);
    const welcome = await lot(s, "welcome", 500, "2026-02-20T00:00:00Z");
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
    await s.ledger.settle(a.id);
    await s.ledger.settle(a.id);
    expect(s.ledgerRepo.rows.filter((r) => r.lotId === welcome!.id).map((r) => [r.reason, r.delta, r.lotRemainingAfter])).toEqual([
      ["grant", 500, 500],
      ["expire", -500, 0],
    ]);
  });

  it("an action after an expiry writes the expire row and draws the next lot (UC116)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    await lot(s, "top_up", 1000);
    vi.setSystemTime(new Date("2026-03-02T10:00:00Z"));
    expect(await s.ledger.charge(ACME, run("run-12"))).toMatchObject({ ok: true, balance: 995 });
    expect(s.ledgerRepo.rows.slice(-2).map((r) => [s.lotRepo.rows.find((l) => l.id === r.lotId)!.reason, r.reason, r.delta])).toEqual([
      ["plan", "expire", -2000],
      ["top_up", "charge", -5],
    ]);
  });
});

describe("refund", () => {
  it("returns a charge that spanned two lots into both, once (UC51, UC53, UC54)", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "plan", 3, "2026-03-02T09:00:00Z");
    await lot(s, "top_up", 100);
    await s.ledger.charge(ACME, run("run-13"));
    expect(await s.ledger.refund({ ref: "run-13" })).toEqual({ refunded: true, balance: 103 });
    expect(rowsOf(s, "run-13").filter((r) => r[1] === "refund")).toEqual([
      ["plan", "refund", 3, 3],
      ["top_up", "refund", 2, 100],
    ]);
    expect(await s.ledger.refund({ ref: "run-13" })).toMatchObject({ refunded: false });
    expect(rowsOf(s, "run-13").filter((r) => r[1] === "refund")).toHaveLength(2);
  });

  it("writes off at once what comes back to a lot that has expired since", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    await s.ledger.charge(ACME, run("run-14"));
    vi.setSystemTime(new Date("2026-03-05T00:00:00Z"));
    expect(await s.ledger.refund({ ref: "run-14" })).toEqual({ refunded: true, balance: 0 });
    expect(rowsOf(s, "run-14").map((r) => r[1])).toEqual(["charge", "refund"]);
    expect(s.ledgerRepo.rows.at(-1)).toMatchObject({ reason: "expire", delta: -2000, lotRemainingAfter: 0 });
  });

  it("is a no-op for a reference that was never charged", async () => {
    expect(await stack().ledger.refund({ ref: "never" })).toEqual({ refunded: false });
  });
});

describe("grants and welcome", () => {
  it("grants welcome credits once per owner, expiring after the catalog's days (UC38, UC40)", async () => {
    const s = stack();
    expect(await s.accounts.welcomeUser(NADIA)).toBe(true);
    expect(await s.accounts.welcomeUser(NADIA)).toBe(false);
    const lots = s.lotRepo.rows.filter((l) => l.reason === "welcome");
    expect(lots).toHaveLength(1);
    expect(lots[0]).toMatchObject({ amount: 500, priority: 1, expiresAt: new Date("2026-08-11T11:30:00.000Z") });
  });

  it("refuses a second lot for the same source", async () => {
    const s = stack();
    const a = await acme(s);
    expect(await s.ledger.grant(FAKE_TX, { owner: ACME, reason: "top_up", amount: 1000, sourceRef: "cs_1" })).not.toBeNull();
    expect(await s.ledger.grant(FAKE_TX, { owner: ACME, reason: "top_up", amount: 1000, sourceRef: "cs_1" })).toBeNull();
    expect((await s.ledger.balances(FAKE_TX, a.id)).platform).toBe(1000);
  });

  it("ends the live lots of a reason now, with one expire row each", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "plan", 2000, "2026-03-02T09:00:00Z");
    await lot(s, "top_up", 1000);
    await s.ledger.charge(ACME, run("run-15"));
    await s.ledger.endLots(FAKE_TX, ACME, "plan", { sourceEventId: "evt_9" });
    expect(s.ledgerRepo.rows.at(-1)).toMatchObject({ reason: "expire", delta: -1995, sourceEventId: "evt_9" });
    expect(await s.ledger.balances(FAKE_TX, a.id)).toEqual({ platform: 1000, limited: [], vendors: [] });
  });
});

describe("take back", () => {
  const bought = (s: Stack, amount: number, expiresAt: Date | null = null) =>
    s.ledger.grant(FAKE_TX, { owner: ACME, reason: "top_up", amount, expiresAt, sourceRef: "cs_9" });

  it("takes the lot's credits when none were spent", async () => {
    const s = stack();
    const a = await acme(s);
    await bought(s, 1000);
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 1000, sourceEventId: "evt_1" })).toBe(1000);
    expect(s.ledgerRepo.rows.at(-1)).toMatchObject({ reason: "take_back", delta: -1000, lotRemainingAfter: 0, ref: "evt_1", sourceEventId: "evt_1" });
    expect((await s.ledger.balances(FAKE_TX, a.id)).platform).toBe(0);
  });

  it("takes only what is left: never below zero, what was spent stays spent", async () => {
    const s = stack();
    const a = await acme(s);
    await bought(s, 1000);
    await s.ledger.charge(ACME, run("spent", 140)); // 700 cents at 5
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 1000, sourceEventId: "evt_2" })).toBe(300);
    expect(s.lotRepo.rows[0].remaining).toBe(0);
    expect((await s.ledger.balances(FAKE_TX, a.id)).platform).toBe(0);
  });

  it("a partial refund takes at most its share", async () => {
    const s = stack();
    await acme(s);
    await bought(s, 1000);
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 400, sourceEventId: "evt_3" })).toBe(400);
    expect(s.lotRepo.rows[0].remaining).toBe(600);
  });

  it("a repeated event takes nothing more", async () => {
    const s = stack();
    await acme(s);
    await bought(s, 1000);
    await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 100, sourceEventId: "evt_4" });
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 100, sourceEventId: "evt_4" })).toBe(0);
    expect(s.lotRepo.rows[0].remaining).toBe(900);
  });

  it("takes nothing from a lot that has expired: the expiry is on the record first", async () => {
    const s = stack();
    await acme(s);
    await bought(s, 1000, new Date("2026-02-20T00:00:00Z"));
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_9", upTo: 1000, sourceEventId: "evt_5" })).toBe(0);
    expect(s.ledgerRepo.rows.map((r) => r.reason)).toEqual(["grant", "expire"]);
  });

  it("takes nothing from a source that granted nothing, or from another owner's lot", async () => {
    const s = stack();
    await acme(s);
    await bought(s, 1000);
    await s.accounts.ensure(FAKE_TX, { userId: NADIA });
    expect(await s.ledger.takeBack(FAKE_TX, ACME, { sourceRef: "cs_none", upTo: 1000, sourceEventId: "evt_6" })).toBe(0);
    expect(await s.ledger.takeBack(FAKE_TX, { userId: NADIA }, { sourceRef: "cs_9", upTo: 1000, sourceEventId: "evt_7" })).toBe(0);
    expect(s.lotRepo.rows[0].remaining).toBe(1000);
  });
});

describe("vendor credits", () => {
  it("draws the price across the buyer's lots at that vendor, all or nothing", async () => {
    const s = stack();
    await acme(s);
    await lot(s, "vendor_refund", 300, null, BOREALIS);
    await lot(s, "promotion", 300, "2026-03-01T00:00:00Z", BOREALIS);
    expect(await s.ledger.chargeVendor(FAKE_TX, { owner: ACME, vendorOrganizationId: BOREALIS, amount: 700, purchaseId: "pu-1", userId: NADIA })).toEqual({ ok: false, balance: 600 });
    expect(await s.ledger.chargeVendor(FAKE_TX, { owner: ACME, vendorOrganizationId: BOREALIS, amount: 400, purchaseId: "pu-2", userId: NADIA })).toEqual({ ok: true });
    expect(rowsOf(s, "pu-2")).toEqual([
      ["promotion", "charge", -300, 0],
      ["vendor_refund", "charge", -100, 200],
    ]);
    expect(await s.ledger.vendorBalance(FAKE_TX, ACME, BOREALIS)).toBe(200);
  });

  it("answers what a vendor issued and who holds it", async () => {
    const s = stack();
    s.lotRepo.accounts = s.accountRepo;
    await acme(s);
    await lot(s, "vendor_refund", 300, null, BOREALIS);
    expect(await s.ledger.issuedBy(FAKE_TX, BOREALIS)).toEqual({
      issued: 300, holders: [{ organizationId: "o-acme", userId: null, remaining: 300, soonestExpiry: null }],
    });
  });
});

describe("weekly allocation", () => {
  it("caps a member per week, counts refunds back, and resets the next Monday (UC56–UC59)", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "top_up", 5000);
    await s.allowances.set(FAKE_TX, { accountId: a.id, organizationId: "o-acme", userId: NADIA, rule: weekly(25) });

    expect((await s.ledger.charge(ACME, run("a-1", 3))).ok).toBe(true);
    expect(await s.ledger.charge(ACME, run("a-2", 3))).toMatchObject({ ok: false, reason: "allowance", remaining: 10, balance: 4985 });

    await s.ledger.refund({ ref: "a-1" });
    expect(await s.allowances.forMember(FAKE_TX, a.id, NADIA)).toMatchObject({ spent: 0, remaining: 25 });
    expect((await s.ledger.charge(ACME, run("a-3", 5))).ok).toBe(true);
    expect(await s.allowances.forMember(FAKE_TX, a.id, NADIA)).toMatchObject({ spent: 25, remaining: 0 });

    vi.setSystemTime(new Date("2026-02-16T00:00:00.000Z"));
    expect(await s.allowances.forMember(FAKE_TX, a.id, NADIA)).toMatchObject({ spent: 0, remaining: 25 });
  });

  it("does not cap another member, and clearing uncaps (UC60)", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "top_up", 5000);
    await s.allowances.set(FAKE_TX, { accountId: a.id, organizationId: "o-acme", userId: NADIA, rule: weekly(1) });
    expect((await s.ledger.charge(ACME, { service: "assistant", units: 1, ref: "b-1", userId: "u-olivia" })).ok).toBe(true);
    expect((await s.ledger.charge(ACME, run("b-2"))).ok).toBe(false);
    expect(await s.allowances.clear(FAKE_TX, a.id, NADIA)).toBe(true);
    expect((await s.ledger.charge(ACME, run("b-3"))).ok).toBe(true);
  });

  it("no cap by default", async () => {
    const s = stack();
    const a = await acme(s);
    await lot(s, "top_up", 5000);
    expect(await s.allowances.forMember(FAKE_TX, a.id, NADIA)).toBeNull();
    expect((await s.ledger.charge(ACME, run("d-1", 900))).ok).toBe(true);
  });

  it("never counts a purchase paid in vendor credits against the cap (UC126)", async () => {
    const s = stack();
    const a = await acme(s);
    await s.allowances.set(FAKE_TX, { accountId: a.id, organizationId: "o-acme", userId: NADIA, rule: weekly(25) });
    await lot(s, "vendor_refund", 4900, null, BOREALIS);
    await s.ledger.chargeVendor(FAKE_TX, { owner: ACME, vendorOrganizationId: BOREALIS, amount: 4900, purchaseId: "pu-1", userId: NADIA });
    expect(await s.allowances.forMember(FAKE_TX, a.id, NADIA)).toMatchObject({ spent: 0, remaining: 25 });
    expect(await s.ledger.refund({ ref: "pu-1" })).toEqual({ refunded: false });
  });

  it("never caps personal credits", async () => {
    const s = stack();
    await s.accounts.welcomeUser(NADIA);
    expect((await s.ledger.charge({ userId: NADIA }, { service: "assistant", units: 50, ref: "c-1", userId: NADIA })).ok).toBe(true);
  });

  it("starts the week at UTC midnight on Monday", () => {
    expect(periodStart("week", new Date("2026-02-11T23:59:59.000Z")).toISOString()).toBe("2026-02-09T00:00:00.000Z");
    expect(periodStart("week", new Date("2026-02-09T00:00:00.000Z")).toISOString()).toBe("2026-02-09T00:00:00.000Z");
    expect(periodStart("week", new Date("2026-02-08T12:00:00.000Z")).toISOString()).toBe("2026-02-02T00:00:00.000Z");
  });
});
