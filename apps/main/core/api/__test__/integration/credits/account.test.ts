/**
 * The credits API on a REAL Postgres (PGlite) with the REAL access-control
 * config, engine and gate — nothing but the credits slice mounted, which is
 * what an app that only has credits runs:
 *   - who may see an organization's credits (Owner inherits Manage Billing; a
 *     manager and a standard member are refused)
 *   - a person's own credits are theirs alone
 *   - a member sees exactly their own allocation
 *   - an admin grants credits, they are spent, spending stops at the balance
 *     and at the allocation
 *   - which organization types may create credits is the access-control
 *     config's, and it reaches only the caller's own organization
 */

import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { mountCreditsApi } from "@modules/credits/api";
import { creditAccount, creditLot } from "@modules/credits/models";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { baselineRoles, hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyCreditsMigration, catalog, errors, people, silent } from "./support";

const ORG_A = "org-a";
const OWNER = "u-owner-a";
const MANAGER = "u-mgr-a";
const MEMBER = "u-std-a";
const STRANGER = "u-owner-b";
const PAGE = { page: 1, pageSize: 10 };
const rule = (credits: number, over: Record<string, unknown> = {}) => ({ credits, period: "week", unspent: "replace", services: null, createsCredits: false, ...over }) as const;

describe("credits API (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let credits: ReturnType<typeof mountCreditsApi>;

  const ac = (userId: string, activeOrgId: string | null = null): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, activeOrgId);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  /** Someone holding a role in an organization of a type, from the real config. */
  const holding = (userId: string, organization: { id: string; type: string }, role: string): ScopedAcRequestContext => {
    const bag = { session: { user: { id: userId }, organization } };
    const roles = [...baselineRoles, role];
    return { bag, roles, permissions: engine.resolveEffectivePermissions(roles, bag), gateDb: gate(bag) } as ScopedAcRequestContext;
  };
  const acmeRow = async () => (await db.select().from(creditAccount).where(eq(creditAccount.organizationId, ORG_A)))[0];

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyCreditsMigration(db.$client);
    gate = makeGate(db, engine);
    credits = mountCreditsApi({ db, createId, catalog, engine, people, logger: silent, errors });
    await credits.welcome.organization(ORG_A);
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("lets the owner see the company's credits and refuses a manager, a member and a stranger", async () => {
    const { accounts } = credits.services;
    expect(await accounts.summary(ac(OWNER, ORG_A), "organization")).toMatchObject({ balance: 500, currency: "eur", limited: [], vendorBalances: [] });
    await expect(accounts.summary(ac(MANAGER, ORG_A), "organization")).rejects.toThrow(/forbidden/);
    await expect(accounts.summary(ac(MEMBER, ORG_A), "organization")).rejects.toThrow(/forbidden/);
    const theirs = await accounts.summary(ac(STRANGER, "org-b"), "organization");
    expect(theirs.accountId).not.toBe((await acmeRow()).id);
    await expect(accounts.summary(ac(MEMBER), "organization")).rejects.toThrow(/no active organization/);
  });

  it("gives a person their own credits, apart from the organization's", async () => {
    const { accounts } = credits.services;
    const mine = await accounts.summary(ac(MEMBER, ORG_A), "account");
    expect(mine).toMatchObject({ balance: 0 });
    expect(mine.accountId).not.toBe((await acmeRow()).id);
    const ledger = await accounts.ledger(ac(OWNER, ORG_A), "organization", PAGE);
    expect(ledger.rows.map((r) => [r.lotReason, r.reason, r.delta])).toEqual([["welcome", "grant", 500]]);
    const lots = await accounts.lots(ac(OWNER, ORG_A), "organization", PAGE);
    expect(lots.rows.map((l) => [l.reason, l.remaining, l.expired, l.services])).toEqual([["welcome", 500, false, null]]);
    await expect(accounts.lots(ac(MEMBER, ORG_A), "organization", PAGE)).rejects.toThrow(/forbidden/);
  });

  it("shows a member exactly their own allocation, and lets only a billing manager set one", async () => {
    const { accounts } = credits.services;
    await expect(accounts.setAllowance(ac(MEMBER, ORG_A), MANAGER, rule(5))).rejects.toThrow(/forbidden/);
    await expect(accounts.allowances(ac(MANAGER, ORG_A))).rejects.toThrow(/forbidden/);

    expect(await accounts.setAllowance(ac(OWNER, ORG_A), MEMBER, rule(5))).toMatchObject({ userId: MEMBER, credits: 5, remaining: 5 });
    expect(await accounts.myAllowance(ac(MEMBER, ORG_A))).toMatchObject({ credits: 5, spent: 0, period: "week" });
    expect(await accounts.myAllowance(ac(MANAGER, ORG_A))).toBeNull();
    expect((await accounts.allowances(ac(OWNER, ORG_A))).rows.map((a) => a.userId)).toEqual([MEMBER]);
    expect(await accounts.clearAllowance(ac(OWNER, ORG_A), MEMBER)).toBe(true);
  });

  it("a member under the rule for everyone sees it as their own", async () => {
    const { accounts } = credits.services;
    await accounts.setAllowance(ac(OWNER, ORG_A), null, rule(7));
    expect(await accounts.myAllowance(ac(MANAGER, ORG_A))).toMatchObject({ userId: MANAGER, inherited: true, credits: 7 });
    expect(await accounts.clearAllowance(ac(OWNER, ORG_A), null)).toBe(true);
    expect(await accounts.myAllowance(ac(MANAGER, ORG_A))).toBeNull();
  });

  it("grant, spend, stop: an app with credits alone", async () => {
    const owner = { organizationId: "org-b" };
    const bag = { session: { user: { id: "u-petra" }, organization: { id: "org-p", type: "platform_admin" } } };
    const roles = [...baselineRoles, "platform_owner"];
    const admin = { bag, roles, permissions: engine.resolveEffectivePermissions(roles, bag), gateDb: gate(bag) } as ScopedAcRequestContext;
    await credits.services.grants.grant(admin, { owner, amount: 30, services: null, expiresAt: null, priority: 1 });
    const account = (await db.select().from(creditAccount).where(eq(creditAccount.organizationId, "org-b")))[0];
    await credits.services.accounts.setAllowance(ac(STRANGER, "org-b"), "u-capped", rule(10));

    const run = (ref: string, userId: string) => credits.metering.charge(owner, { service: "assistant", units: 1, ref, userId });
    expect((await run("a", "u-capped")).ok).toBe(true); // 10 of the allocation
    expect(await run("b", "u-capped")).toMatchObject({ ok: false, reason: "allowance" });
    expect((await run("c", "u-free")).ok).toBe(true);
    expect((await run("d", "u-free")).ok).toBe(true);
    expect(await run("e", "u-free")).toMatchObject({ ok: false, reason: "balance", balance: 0, cost: 10 });
    expect((await credits.services.ledger.balances(db, account.id)).platform).toBe(0);
  });

  it("refuses a company owner a rule that creates credits: a company buys them", async () => {
    const { accounts } = credits.services;
    expect((await accounts.allowances(ac(OWNER, ORG_A))).canCreate).toBe(false);
    await expect(accounts.setAllowance(ac(OWNER, ORG_A), MEMBER, rule(5, { createsCredits: true }))).rejects.toThrow(/forbidden: this organization cannot create credits/);
    expect((await accounts.allowances(ac(OWNER, ORG_A))).rows).toEqual([]);
  });

  it("lets a musical project's owner create credits on their own organization only", async () => {
    const { accounts } = credits.services;
    const project = { id: "org-band", type: "musical_project" };
    const owner = holding("u-band-owner", project, "musical_project_owner");
    expect((await accounts.allowances(owner)).canCreate).toBe(true);

    await accounts.setAllowance(owner, "u-singer", rule(100, { createsCredits: true }));
    const [band] = await db.select().from(creditAccount).where(eq(creditAccount.organizationId, "org-band"));
    const lots = await db.select().from(creditLot).where(eq(creditLot.accountId, band.id));
    expect(lots.map((l) => [l.reason, l.amount, l.remaining])).toEqual([["allocation", 100, 100]]);
    expect((await credits.metering.charge({ organizationId: "org-band" }, { service: "assistant", units: 1, ref: "band-1", userId: "u-singer" })).ok).toBe(true);

    // the permission follows the caller's active organization; a member of the project has neither it nor the management of the credits
    await expect(accounts.setAllowance(holding("u-singer", project, "musical_project_member"), "u-singer", rule(100, { createsCredits: true }))).rejects.toThrow(/forbidden/);
    // and it does not reach the platform owner's grants
    await expect(credits.services.grants.grant(owner, { owner: { organizationId: ORG_A }, amount: 1, services: null, expiresAt: null, priority: 1 })).rejects.toThrow(/forbidden/);
  });

  it("creates the service list as a Postgres array and draws only what can pay", async () => {
    const owner = { userId: "u-lists" };
    const { ledger } = credits.services;
    await db.transaction((tx) => ledger.grant(tx, { owner, reason: "admin_grant", amount: 20, serviceKeys: ["assistant"] }));
    await db.transaction((tx) => ledger.grant(tx, { owner, reason: "admin_grant", amount: 20, serviceKeys: ["other"] }));
    expect(await credits.metering.charge(owner, { service: "assistant", units: 3, ref: "l-1", userId: "u-lists" })).toMatchObject({ ok: false, reason: "balance", balance: 20, cost: 30 });
    expect(await credits.metering.charge(owner, { service: "assistant", units: 2, ref: "l-2", userId: "u-lists" })).toMatchObject({ ok: true, balance: 0 });
    const [account] = await db.select().from(creditAccount).where(eq(creditAccount.userId, "u-lists"));
    expect(await ledger.balances(db, account.id)).toEqual({ platform: 0, limited: [{ services: ["other"], amount: 20 }], vendors: [] });
  });
});
