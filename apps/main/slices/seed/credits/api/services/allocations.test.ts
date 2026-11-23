/**
 * Credits limited to services, and what an organization lets each member
 * spend: per day, week or month, top up or replace, drawing on what the
 * organization holds or creating the credits. The clock moves; the rest runs
 * on the in-memory repositories. Who may make a rule create credits is the
 * real engine's, proven on PGlite.
 */

import { describe, expect, it, vi } from "vitest";
import { LedgerService } from "./ledger.service";
import { AllowanceService, advance, periodStart, periodsSince } from "./allowance.service";
import {
  InMemoryCreditAccountRepository,
  InMemoryCreditLedgerRepository,
  InMemoryCreditLotRepository,
  InMemoryMemberAllowanceRepository,
  FAKE_TX,
  nextId,
  runInFakeTransaction,
  silentLogger,
} from "../testing/in-memory-repos";
import type { AllowanceInput, LotReason } from "../../shared/types";
import type { CreditsCatalog } from "../../shared/catalog";

const ACME = { organizationId: "o-acme" } as const;
const NADIA = "u-nadia";
const OLIVIA = "u-olivia";

const catalog: Pick<CreditsCatalog, "currency" | "defaultPriceList" | "priceLists"> = {
  currency: "eur",
  defaultPriceList: "free",
  priceLists: { free: { meteor: 10, chat: 10, search: 10 } },
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
  return { accountRepo, lotRepo, ledgerRepo, allowanceRepo, allowances, ledger };
}
type Stack = ReturnType<typeof stack>;

const account = async (s: Stack) => (await s.accountRepo.ensure(FAKE_TX, nextId("acc"), ACME)).id;
const fund = (s: Stack, amount: number, serviceKeys: string[] | null = null, reason: LotReason = "top_up") => s.ledger.grant(FAKE_TX, { owner: ACME, reason, amount, serviceKeys });
const spend = (s: Stack, ref: string, service = "meteor", userId = NADIA, units = 1) => s.ledger.charge(ACME, { service, units, ref, userId });
const rule = (over: Partial<AllowanceInput> = {}): AllowanceInput => ({ credits: 100, period: "month", unspent: "replace", services: null, createsCredits: false, ...over });
const save = async (s: Stack, input: AllowanceInput, userId: string | null = NADIA) => {
  const accountId = await account(s);
  const result = await s.allowances.set(FAKE_TX, { accountId, organizationId: "o-acme", userId, rule: input });
  for (const raise of result.raises) await s.ledger.grant(FAKE_TX, { owner: ACME, reason: "allocation", amount: raise.amount, expiresAt: raise.expiresAt, sourceRef: raise.sourceRef });
  return result.allowance;
};
const left = async (s: Stack, userId = NADIA) => (await s.allowances.forMember(FAKE_TX, await account(s), userId))?.remaining;
const allocationLots = (s: Stack) => s.lotRepo.rows.filter((l) => l.reason === "allocation");

describe("periods", () => {
  it("start at UTC midnight: the day, Monday, the 1st", () => {
    const wed = new Date("2026-02-11T23:59:59.000Z");
    expect(periodStart("day", wed).toISOString()).toBe("2026-02-11T00:00:00.000Z");
    expect(periodStart("week", wed).toISOString()).toBe("2026-02-09T00:00:00.000Z");
    expect(periodStart("month", wed).toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("advance across a year and count both ends", () => {
    const dec = new Date("2025-12-01T00:00:00.000Z");
    expect(advance("month", dec, 2).toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(periodsSince("month", dec, new Date("2026-02-12T00:00:00.000Z"))).toBe(3);
    expect(periodsSince("day", new Date("2026-02-10T00:00:00.000Z"), new Date("2026-02-12T11:00:00.000Z"))).toBe(3);
    expect(periodsSince("week", new Date("2026-02-09T00:00:00.000Z"), new Date("2026-02-15T23:00:00.000Z"))).toBe(1);
    expect(periodsSince("month", new Date("2026-03-01T00:00:00.000Z"), new Date("2026-02-12T00:00:00.000Z"))).toBe(0);
  });
});

describe("credits limited to services", () => {
  it("pays for the services on the list and refuses the rest", async () => {
    const s = stack();
    await fund(s, 50, ["chat", "meteor"], "admin_grant");
    expect(await spend(s, "m-1")).toMatchObject({ ok: true, balance: 40 });
    expect(await spend(s, "c-1", "chat")).toMatchObject({ ok: true, balance: 30 });
    expect(await spend(s, "s-1", "search")).toMatchObject({ ok: false, reason: "balance", balance: 0, cost: 10 });
  });

  it("draws restricted credits before general ones of the same priority", async () => {
    const s = stack();
    await fund(s, 100, null, "admin_grant");
    await fund(s, 15, ["meteor"], "admin_grant");
    await spend(s, "m-2", "meteor", NADIA, 2); // 20: all 15 restricted, then 5 general
    const [restricted, general] = [s.lotRepo.rows[1], s.lotRepo.rows[0]];
    expect([restricted.remaining, general.remaining]).toEqual([0, 95]);
  });

  it("gives a refund back to the restricted lot it came from", async () => {
    const s = stack();
    await fund(s, 50, ["meteor"], "admin_grant");
    await spend(s, "m-3");
    expect(await s.ledger.refund({ ref: "m-3" })).toEqual({ refunded: true, balance: 50 });
  });

  it("reports general and restricted credits apart, grouped by list", async () => {
    const s = stack();
    const id = await account(s);
    await fund(s, 1000);
    await fund(s, 300, ["meteor", "chat"], "admin_grant");
    await fund(s, 200, ["chat", "meteor"], "admin_grant");
    expect(await s.ledger.balances(FAKE_TX, id)).toEqual({ platform: 1000, limited: [{ services: ["chat", "meteor"], amount: 500 }], vendors: [] });
  });
});

describe("allocations on bought credits", () => {
  it("no rule, no limit", async () => {
    const s = stack();
    await fund(s, 10_000);
    expect((await spend(s, "a-1", "meteor", NADIA, 500)).ok).toBe(true);
  });

  it("replace: the amount minus this period's spending, and the next period starts over", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule());
    await spend(s, "b-1", "meteor", NADIA, 4);
    expect(await left(s)).toBe(60);
    expect(await spend(s, "b-2", "meteor", NADIA, 7)).toMatchObject({ ok: false, reason: "allowance", remaining: 60 });
    vi.setSystemTime(new Date("2026-03-01T00:00:00.000Z"));
    expect(await left(s)).toBe(100);
    expect((await spend(s, "b-3", "meteor", NADIA, 10)).ok).toBe(true);
  });

  it("top up: unspent credits add up", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule({ unspent: "top_up" }));
    await spend(s, "c-1", "meteor", NADIA, 4);
    vi.setSystemTime(new Date("2026-03-05T00:00:00.000Z"));
    expect(await left(s)).toBe(160);
    expect((await spend(s, "c-2", "meteor", NADIA, 16)).ok).toBe(true);
    expect(await spend(s, "c-3")).toMatchObject({ ok: false, reason: "allowance" });
  });

  it("replace leaves the organization's bought credits with the organization", async () => {
    const s = stack();
    const id = await account(s);
    await fund(s, 500);
    await save(s, rule());
    vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));
    await s.ledger.settle(id);
    expect((await s.ledger.balances(FAKE_TX, id)).platform).toBe(500);
    expect(allocationLots(s)).toEqual([]);
  });

  it("stops at the organization's balance even with allocation left", async () => {
    const s = stack();
    await fund(s, 15);
    await save(s, rule());
    expect((await spend(s, "d-1")).ok).toBe(true);
    expect(await spend(s, "d-2")).toMatchObject({ ok: false, reason: "balance", balance: 5 });
  });

  it("stops at the allocation even when the organization holds plenty", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule({ credits: 10 }));
    expect((await spend(s, "e-1")).ok).toBe(true);
    expect(await spend(s, "e-2")).toMatchObject({ ok: false, reason: "allowance", remaining: 0 });
  });

  it("refuses a service the rule leaves out", async () => {
    const s = stack();
    await fund(s, 1000);
    await save(s, rule({ services: ["chat", "meteor"] }));
    expect((await spend(s, "f-1", "chat")).ok).toBe(true);
    expect(await spend(s, "f-2", "search")).toMatchObject({ ok: false, reason: "allowance" });
    expect(s.ledgerRepo.rows.filter((r) => r.ref === "f-2")).toEqual([]);
  });

  it("does not limit personal credits", async () => {
    const s = stack();
    await s.ledger.grant(FAKE_TX, { owner: { userId: NADIA }, reason: "top_up", amount: 1000 });
    expect((await s.ledger.charge({ userId: NADIA }, { service: "meteor", units: 50, ref: "g-1", userId: NADIA })).ok).toBe(true);
  });
});

describe("the rule for every member", () => {
  it("covers a member with no rule, and a member's own rule overrides it", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule({ credits: 20 }), null);
    await save(s, rule({ credits: 50 }), OLIVIA);
    expect(await left(s, NADIA)).toBe(20);
    expect(await left(s, OLIVIA)).toBe(50);
    await spend(s, "h-1", "meteor", NADIA, 2);
    expect(await spend(s, "h-2", "meteor", NADIA)).toMatchObject({ ok: false, reason: "allowance" });
    expect((await spend(s, "h-3", "meteor", OLIVIA, 5)).ok).toBe(true);
    expect(s.allowanceRepo.rows.find((r) => r.userId === NADIA)).toMatchObject({ inherited: true });
    expect(s.allowanceRepo.rows.find((r) => r.userId === OLIVIA)).toMatchObject({ inherited: false });
  });

  it("starts a member who first comes under it now, not when the rule began", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule({ unspent: "top_up" }), null);
    vi.setSystemTime(new Date("2026-05-10T00:00:00.000Z"));
    await spend(s, "i-1");
    expect(await left(s)).toBe(90);
  });

  it("carries a change to the members following it, and removing it frees them", async () => {
    const s = stack();
    await fund(s, 10_000);
    await save(s, rule({ credits: 20 }), null);
    await spend(s, "j-1");
    await save(s, rule({ credits: 40 }), null);
    expect(await left(s)).toBe(30);
    const id = await account(s);
    expect(await s.allowances.clear(FAKE_TX, id, null)).toBe(true);
    expect(await left(s)).toBeUndefined();
    expect(s.allowanceRepo.rows).toEqual([]);
  });

  it("a member's own rule stays when the rule for everyone goes", async () => {
    const s = stack();
    await save(s, rule({ credits: 20 }), null);
    await save(s, rule({ credits: 50 }));
    await s.allowances.clear(FAKE_TX, await account(s), null);
    expect(await left(s)).toBe(50);
  });
});

describe("allocations that create credits", () => {
  const creating = (over: Partial<AllowanceInput> = {}) => rule({ createsCredits: true, ...over });

  it("creates the period's credits once, expiring at its end, on replace", async () => {
    const s = stack();
    await save(s, creating());
    expect((await spend(s, "k-1")).ok).toBe(true);
    await spend(s, "k-2");
    expect(allocationLots(s).map((l) => [l.amount, l.remaining, l.priority, l.expiresAt?.toISOString()])).toEqual([[100, 80, 1, "2026-03-01T00:00:00.000Z"]]);
  });

  it("replace: what was left expires, the new period gets a new lot", async () => {
    const s = stack();
    const id = await account(s);
    await save(s, creating());
    await spend(s, "l-1");
    vi.setSystemTime(new Date("2026-03-02T00:00:00.000Z"));
    await s.ledger.settle(id);
    expect(allocationLots(s).map((l) => [l.amount, l.remaining])).toEqual([[100, 0], [100, 100]]);
    expect((await s.ledger.balances(FAKE_TX, id)).platform).toBe(100);
    expect(s.ledgerRepo.rows.filter((r) => r.reason === "expire").map((r) => r.delta)).toEqual([-90]);
  });

  it("top up: credits never expire, and months away arrive together on return", async () => {
    const s = stack();
    const id = await account(s);
    await save(s, creating({ unspent: "top_up" }));
    await spend(s, "m-1");
    vi.setSystemTime(new Date("2026-05-20T00:00:00.000Z"));
    await spend(s, "m-2");
    expect(allocationLots(s).map((l) => [l.amount, l.expiresAt])).toEqual([[100, null], [300, null]]);
    expect(await left(s)).toBe(380);
    expect((await s.ledger.balances(FAKE_TX, id)).platform).toBe(380);
  });

  it("a page read brings the organization up to date, and reading twice creates nothing more", async () => {
    const s = stack();
    const id = await account(s);
    await save(s, creating());
    await s.ledger.settle(id);
    await s.ledger.settle(id);
    expect(allocationLots(s)).toHaveLength(1);
  });

  it("covers a member under the rule for everyone when they first act", async () => {
    const s = stack();
    await save(s, creating({ credits: 30 }), null);
    expect(allocationLots(s)).toEqual([]);
    expect((await spend(s, "n-1")).ok).toBe(true);
    await spend(s, "n-2", "meteor", OLIVIA);
    expect(allocationLots(s).map((l) => l.amount)).toEqual([30, 30]);
  });

  it("a raised replace amount creates the difference for this period", async () => {
    const s = stack();
    await save(s, creating());
    await s.ledger.settle(await account(s));
    await save(s, creating({ credits: 150 }));
    expect(allocationLots(s).map((l) => [l.amount, l.expiresAt?.toISOString()])).toEqual([[100, "2026-03-01T00:00:00.000Z"], [50, "2026-03-01T00:00:00.000Z"]]);
    expect(await left(s)).toBe(150);
  });

  it("a changed top-up amount keeps what was left and counts from the next period", async () => {
    const s = stack();
    await save(s, creating({ unspent: "top_up" }));
    await spend(s, "o-1", "meteor", NADIA, 3);
    await s.ledger.settle(await account(s));
    vi.setSystemTime(new Date("2026-02-12T12:00:00.000Z"));
    await save(s, creating({ unspent: "top_up", credits: 500 }));
    expect(await left(s)).toBe(70);
    vi.setSystemTime(new Date("2026-03-03T00:00:00.000Z"));
    expect(await left(s)).toBe(570);
    await spend(s, "o-2");
    expect(allocationLots(s).map((l) => l.amount)).toEqual([100, 500]);
    expect(await left(s)).toBe(560);
  });

  it("a different period or mode starts fresh", async () => {
    const s = stack();
    await save(s, creating({ unspent: "top_up" }));
    vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));
    await save(s, creating({ period: "week", credits: 40 }));
    expect(await left(s)).toBe(40);
  });
});
