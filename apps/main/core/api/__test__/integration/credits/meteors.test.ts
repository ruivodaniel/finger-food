/**
 * The first spender on a REAL Postgres (PGlite) with the REAL access-control
 * config, engine and gate: creating a meteor spends the company's credits, a
 * refused charge is a 402 that writes nothing, a weekly limit stops a member,
 * and a delete gives the credits back only within a minute of the creation.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { PRIVATE, type ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { createId } from "@paralleldrive/cuid2";
import { mountCreditsApi } from "@modules/credits/api";
import { creditAccount, creditLedger } from "@modules/credits/models";
import { mountImplementationPatternsApi } from "@product/implementation-patterns/api";
import { meteor } from "@product/implementation-patterns/models";
import { hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyCreditsMigration, catalog, errors, people, silent } from "./support";

const ORG_A = "org-a";
const MEMBER = "u-std-a";
const OWNER = "u-owner-a";
const meteorCatalog = { ...catalog, services: [...catalog.services, { key: "meteor", name: "Create a meteor", unit: "meteor" }], priceLists: { free: { meteor: 100 } } };

async function applyMeteorsMigration(db: TestDb) {
  const dir = join(__dirname, "../../../drizzle");
  const sql = readdirSync(dir)
    .filter((f) => /^\d{4}_.*\.sql$/.test(f))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .find((text) => text.includes('CREATE TABLE "meteor"'));
  if (!sql) throw new Error("the meteors migration was not found");
  for (const statement of sql.split("--> statement-breakpoint")) if (statement.trim()) await db.$client.exec(statement);
}

describe("meteors spend credits (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let credits: ReturnType<typeof mountCreditsApi>;
  let meteors: ReturnType<typeof mountImplementationPatternsApi>;

  const ac = (userId: string): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, ORG_A);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  const create = (userId: string, name: string) => meteors.services.meteor.create(ac(userId) as never, PRIVATE, { name });
  const remove = (userId: string, id: string) => meteors.services.meteor.remove(ac(userId) as never, PRIVATE, id);
  const balance = async () => {
    const [account] = await db.select().from(creditAccount).where(eq(creditAccount.organizationId, ORG_A));
    return (await credits.services.ledger.balances(db, account.id)).platform;
  };
  const movements = (ref: string) => db.select({ reason: creditLedger.reason, delta: creditLedger.delta }).from(creditLedger).where(eq(creditLedger.ref, ref));
  const count = async () => (await db.select().from(meteor)).length;
  const fund = (amount: number) => db.transaction((tx) => credits.services.ledger.grant(tx, { owner: { organizationId: ORG_A }, reason: "admin_grant", amount }));

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyCreditsMigration(db.$client);
    await applyMeteorsMigration(db);
    gate = makeGate(db, engine);
    credits = mountCreditsApi({ db, createId, catalog: meteorCatalog, engine, people, logger: silent, errors });
    // the meteor table unversioned here, and no meteor locked: what's under test is the spend
    const gatedDb = Object.assign((bag: unknown) => gate(bag), { ungated: () => db, ungatedAs: () => db });
    meteors = mountImplementationPatternsApi({
      createId, engine, gatedDb: gatedDb as never, isLocked: async () => false, credits: credits.metering, logger: silent,
      errors: { ...errors, paymentRequired: (m?: string) => new Error(`payment required: ${m ?? ""}`), conflict: (m?: string) => new Error(`conflict: ${m ?? ""}`) },
    });
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("with no credits the create is refused and no meteor is written", async () => {
    await expect(create(MEMBER, "Broke")).rejects.toThrow(/payment required: not enough credits/);
    expect(await count()).toBe(0);
  });

  it("charges the company under the meteor's own id", async () => {
    await fund(1000);
    const row = await create(MEMBER, "Chelyabinsk");
    expect(await balance()).toBe(900);
    expect(await movements(row.id)).toEqual([{ reason: "charge", delta: -100 }]);
  });

  it("a delete within the minute gives the credits back", async () => {
    const row = await create(MEMBER, "Undone");
    expect(await balance()).toBe(800);
    await remove(MEMBER, row.id);
    expect(await balance()).toBe(900);
    expect((await movements(row.id)).map((m) => m.reason).sort()).toEqual(["charge", "refund"]);
  });

  it("a delete after the minute keeps them spent", async () => {
    const row = await create(MEMBER, "Kept");
    await db.update(meteor).set({ createdAt: new Date(Date.now() - 61_000) }).where(eq(meteor.id, row.id));
    await remove(MEMBER, row.id);
    expect(await balance()).toBe(800);
    expect(await movements(row.id)).toEqual([{ reason: "charge", delta: -100 }]);
  });

  it("a delete the scope refuses gives nothing back", async () => {
    const row = await create(MEMBER, "Protected");
    const before = await balance();
    const outsider = hydrate(engine, "u-owner-b", "org-b");
    await expect(meteors.services.meteor.remove({ ...outsider, gateDb: gate(outsider.bag) } as never, PRIVATE, row.id)).rejects.toThrow(/cannot remove/);
    expect(await balance()).toBe(before);
    expect(await count()).toBeGreaterThan(0);
  });

  it("a weekly limit stops the member and leaves the others", async () => {
    await credits.services.accounts.setAllowance(ac(OWNER), MEMBER, { credits: 1, period: "week", unspent: "replace", services: null, createsCredits: false });
    const before = await count();
    await expect(create(MEMBER, "Capped")).rejects.toThrow(/payment required: your credit allocation does not cover this/);
    expect(await count()).toBe(before);
    await credits.services.accounts.clearAllowance(ac(OWNER), MEMBER);
  });
});
