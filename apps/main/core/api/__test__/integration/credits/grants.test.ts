/**
 * Admin grants on a REAL Postgres (PGlite) with the REAL access-control
 * config and engine: only the Platform Owner, acting in the platform
 * organization, grants platform credits or reads the grants (UC119–UC121).
 * The harness seeds no platform owner, so the context is built here from the
 * same config: the account baseline plus `platform_owner` in the platform
 * organization.
 */

import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { mountCreditsApi } from "@modules/credits/api";
import { creditAccount, creditLot } from "@modules/credits/models";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { baselineRoles, hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyCreditsMigration, catalog, errors, people, silent } from "./support";

describe("credits admin grants (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let credits: ReturnType<typeof mountCreditsApi>;

  const ac = (userId: string, activeOrgId: string | null = null): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, activeOrgId);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  /** A Platform Owner acting in the platform organization, from the real config. */
  const platformOwner = (): ScopedAcRequestContext => {
    const bag = { session: { user: { id: "u-petra" }, organization: { id: "org-p", type: "platform_admin" } } };
    const roles = [...baselineRoles, "platform_owner"];
    return { bag, roles, permissions: engine.resolveEffectivePermissions(roles, bag), gateDb: gate(bag) } as ScopedAcRequestContext;
  };
  const grant = { owner: { organizationId: "org-a" }, amount: 2000, services: null, expiresAt: new Date(Date.now() + 30 * 86_400_000), priority: 1, note: "Onboarding workshop" };

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyCreditsMigration(db.$client);
    gate = makeGate(db, engine);
    credits = mountCreditsApi({ db, createId, catalog, engine, people, logger: silent, errors });
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("lets the Platform Owner grant a company platform credits, with its note (UC119)", async () => {
    const { lotId } = await credits.services.grants.grant(platformOwner(), grant);
    const [lot] = await db.select().from(creditLot).where(eq(creditLot.id, lotId));
    const [alpha] = await db.select().from(creditAccount).where(eq(creditAccount.organizationId, "org-a"));
    expect(lot).toMatchObject({ accountId: alpha.id, reason: "admin_grant", amount: 2000, priority: 1, issuedByUserId: "u-petra", note: "Onboarding workshop" });
    expect((await credits.services.ledger.balances(db, alpha.id)).platform).toBe(2000);
    expect((await credits.services.grants.list(platformOwner(), { page: 1, pageSize: 10 })).rows.map((r) => [r.owner, r.amount, r.note])).toEqual([
      [{ organizationId: "org-a" }, 2000, "Onboarding workshop"],
    ]);
  });

  it("refuses a company's owner, a platform member who is not its owner, and anyone outside the platform (UC120, UC121)", async () => {
    const { grants } = credits.services;
    await expect(grants.grant(ac("u-owner-a", "org-a"), grant)).rejects.toThrow(/forbidden/);
    await expect(grants.grant(ac("u-plat", "org-p"), grant)).rejects.toThrow(/forbidden/);
    await expect(grants.list(ac("u-std-a", "org-a"), { page: 1, pageSize: 10 })).rejects.toThrow(/forbidden/);
    await expect(grants.grant(ac("u-nobody"), grant)).rejects.toThrow(/forbidden/);
    expect(await db.select().from(creditLot).where(eq(creditLot.reason, "admin_grant"))).toHaveLength(1);
  });
});
