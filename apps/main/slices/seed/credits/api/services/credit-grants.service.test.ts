/**
 * Admin grants against the in-memory repositories: what a grant writes, what
 * refuses it, and the list. The platform permission itself is the real
 * engine's, proven on PGlite; here a stub engine says yes or no.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreditGrantsService } from "./credit-grants.service";
import { LedgerService } from "./ledger.service";
import { AllowanceService } from "./allowance.service";
import {
  InMemoryCreditAccountRepository,
  InMemoryCreditLedgerRepository,
  InMemoryCreditLotRepository,
  InMemoryMemberAllowanceRepository,
  FAKE_TX,
  fakePeople,
  nextId,
  runInFakeTransaction,
  silentLogger,
  testErrors,
} from "../testing/in-memory-repos";

const PETRA = { bag: { session: { user: { id: "u-petra" }, organization: { id: "o-platform", type: "platform_admin" } } }, roles: [], permissions: [] } as unknown as ScopedAcRequestContext;
const allow = { allowCreate: () => ({ allow: true as const }) };
const deny = { allowCreate: () => ({ allow: false as const, reason: "create credit_lot denied" }) };
const people = fakePeople({ organizations: { "o-acme": "Acme Corp" }, people: { "u-petra": "Petra" } });

function stack(engine: typeof allow | typeof deny = allow) {
  const accountRepo = new InMemoryCreditAccountRepository();
  const lotRepo = new InMemoryCreditLotRepository();
  lotRepo.accounts = accountRepo;
  const ledgerRepo = new InMemoryCreditLedgerRepository(lotRepo);
  const allowances = new AllowanceService({ allowanceRepo: new InMemoryMemberAllowanceRepository(), ledgerRepo, createId: nextId });
  const ledger = new LedgerService({
    accountRepo, lotRepo, ledgerRepo, allowances, catalog: { currency: "eur", defaultPriceList: "free", priceLists: { free: {} } }, db: FAKE_TX, runInTransaction: runInFakeTransaction, createId: nextId, logger: silentLogger,
  });
  const grants = new CreditGrantsService({
    engine, ledger, lotRepo, catalog: { services: [{ key: "meteor", name: "Create a meteor", unit: "meteor" }, { key: "chat", name: "Chat", unit: "message" }] }, db: FAKE_TX,
    runInTransaction: runInFakeTransaction, errors: testErrors, people,
  });
  return { accountRepo, lotRepo, ledgerRepo, ledger, grants };
}

beforeEach(() => { vi.setSystemTime(new Date("2026-02-16T10:00:00.000Z")); });

describe("admin grants", () => {
  it("writes one admin grant lot with the amount, expiry, priority, note and granter (UC119)", async () => {
    const s = stack();
    const { lotId } = await s.grants.grant(PETRA, {
      owner: { organizationId: "o-acme" }, amount: 2000, services: null, expiresAt: new Date("2026-03-16T00:00:00.000Z"), priority: 1, note: "Onboarding workshop",
    });
    const acme = (await s.accountRepo.findByOwner(FAKE_TX, { organizationId: "o-acme" }))!;
    expect(s.lotRepo.rows.find((l) => l.id === lotId)).toMatchObject({
      accountId: acme.id, reason: "admin_grant", vendorOrganizationId: null, amount: 2000, remaining: 2000, priority: 1,
      expiresAt: new Date("2026-03-16T00:00:00.000Z"), issuedByUserId: "u-petra", note: "Onboarding workshop",
    });
    expect(s.ledgerRepo.rows.map((r) => [r.reason, r.delta])).toEqual([["grant", 2000]]);
    expect((await s.ledger.balances(FAKE_TX, acme.id)).platform).toBe(2000);
  });

  it("lets a grant rank with the plan's credits or with top-ups, and never expire", async () => {
    const s = stack();
    await s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-acme" }, amount: 500, expiresAt: null, priority: 3 });
    expect(s.lotRepo.rows[0]).toMatchObject({ priority: 3, expiresAt: null, note: null });
  });

  it("refuses anyone without the platform's grant permission, writing nothing (UC120, UC121)", async () => {
    const s = stack(deny);
    await expect(s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-acme" }, amount: 200000, expiresAt: null, priority: 1 })).rejects.toThrow(/forbidden: create credit_lot denied/);
    await expect(s.grants.list(PETRA, { page: 1, pageSize: 10 })).rejects.toThrow(/forbidden/);
    await expect(s.grants.searchOwners(PETRA, "acm")).rejects.toThrow(/forbidden/);
    expect(s.lotRepo.rows).toEqual([]);
  });

  it("refuses a past expiry and an owner nobody knows", async () => {
    const s = stack();
    await expect(s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-acme" }, amount: 100, expiresAt: new Date("2026-02-01"), priority: 1 })).rejects.toThrow(/in the future/);
    await expect(s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-ghost" }, amount: 100, expiresAt: null, priority: 1 })).rejects.toThrow(/no such credit owner/);
  });

  it("lists the grants newest first, named, with what remains and whether they expired", async () => {
    const s = stack();
    await s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-acme" }, amount: 1000, expiresAt: new Date("2026-02-20T00:00:00.000Z"), priority: 1, note: "Launch week" });
    vi.setSystemTime(new Date("2026-02-17T10:00:00.000Z"));
    await s.grants.grant(PETRA, { services: null, owner: { organizationId: "o-acme" }, amount: 2000, expiresAt: null, priority: 1 });
    vi.setSystemTime(new Date("2026-02-21T10:00:00.000Z"));
    const { rows, total } = await s.grants.list(PETRA, { page: 1, pageSize: 10 });
    expect(total).toBe(2);
    expect(rows.map((r) => [r.ownerName, r.amount, r.remaining, r.expired, r.note, r.issuedByName])).toEqual([
      ["Acme Corp", 2000, 2000, false, null, "Petra"],
      ["Acme Corp", 1000, 1000, true, "Launch week", "Petra"],
    ]);
  });

  it("writes the services a grant can pay for, sorted, and refuses one the catalog does not know", async () => {
    const s = stack();
    await s.grants.grant(PETRA, { owner: { organizationId: "o-acme" }, amount: 500, services: ["meteor", "chat"], expiresAt: null, priority: 1 });
    expect(s.lotRepo.rows[0].serviceKeys).toEqual(["chat", "meteor"]);
    expect((await s.grants.list(PETRA, { page: 1, pageSize: 10 })).rows[0].services).toEqual(["chat", "meteor"]);
    await expect(s.grants.grant(PETRA, { owner: { organizationId: "o-acme" }, amount: 500, services: ["search"], expiresAt: null, priority: 1 })).rejects.toThrow(/unknown services: search/);
    expect(s.lotRepo.rows).toHaveLength(1);
  });

  it("finds credit owners by name through the app's search", async () => {
    expect(await stack().grants.searchOwners(PETRA, "acm")).toEqual([{ owner: { organizationId: "o-acme" }, name: "Acme Corp", kind: "organization" }]);
  });
});
