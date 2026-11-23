/**
 * The billing API on a REAL Postgres (PGlite) with the REAL access-control
 * config, engine and gate — the deny-by-default harness — plus the fake
 * payment provider and the real credits slice behind the port:
 *   - who may see and manage an organization's billing (Owner inherits
 *     Manage Billing; a manager and a standard member are refused)
 *   - a person's own account is theirs alone
 *   - checkout stands on the same proof and creates the Customer once
 *   - the webhook endpoint: a forged signature is a 400 that claims nothing;
 *     a paid bundle credits once and its replay writes nothing; a handler that
 *     throws rolls its claim back so the provider's retry can succeed
 *   - the two ledgers: one payment, one row in each; both commit or neither;
 *     a refund takes back what is left
 */

import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { FakeProvider } from "@modules/payment/api";
import { creditAccount, creditLedger, creditLot } from "@modules/credits/models";
import { paymentAccount, paymentLedger, paymentStripeEvent } from "@modules/payment/models";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyMigrations, mountBoth } from "./support";

const ORG_A = "org-a";
const OWNER = "u-owner-a";
const MANAGER = "u-mgr-a";
const MEMBER = "u-std-a";
const STRANGER = "u-owner-b";

describe("payment billing API (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let provider: FakeProvider;
  let both: ReturnType<typeof mountBoth>;
  let app: Hono;

  const ac = (userId: string, activeOrgId: string | null = null): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, activeOrgId);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  const acmeRow = async () => (await db.select().from(paymentAccount).where(eq(paymentAccount.organizationId, ORG_A)))[0];
  const acmeCredits = async () => (await db.select().from(creditAccount).where(eq(creditAccount.organizationId, ORG_A)))[0];
  const acmeLots = async () => db.select().from(creditLot).where(eq(creditLot.accountId, (await acmeCredits()).id));
  const balance = async () => (await both.credits.services.ledger.balances(db, (await acmeCredits()).id)).platform;
  const post = (path: string, body: string, signature: string) =>
    app.request(path, { method: "POST", headers: { "stripe-signature": signature, "content-type": "application/json" }, body });
  const bundleEvent = async (id: string, session: string, pi: string) =>
    FakeProvider.body({
      id, type: "checkout.session.completed", kind: "checkout_paid",
      session: { id: session, mode: "payment", paymentStatus: "paid", paymentIntentId: pi, amountTotal: 1000, currency: "eur", metadata: { kind: "bundle", accountId: (await acmeRow()).id, bundleKey: "small" } },
    });

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyMigrations(db.$client);
    gate = makeGate(db, engine);
    provider = new FakeProvider();
    both = mountBoth(db, engine, provider);
    app = new Hono().route(both.payment.webhookMount!.basePath, both.payment.webhookMount!.router);
    await both.credits.welcome.organization(ORG_A);
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("lets the owner see the company's billing and refuses a manager, a member and a stranger", async () => {
    const accounts = both.payment.services.accounts;
    expect(await accounts.summary(ac(OWNER, ORG_A), "organization")).toMatchObject({ planKey: null, hasCustomer: false });
    await expect(accounts.summary(ac(MANAGER, ORG_A), "organization")).rejects.toThrow(/forbidden/);
    await expect(accounts.summary(ac(MEMBER, ORG_A), "organization")).rejects.toThrow(/forbidden/);
    // the stranger owns another company: their organization scope is theirs, never Alpha's
    const theirs = await accounts.summary(ac(STRANGER, "org-b"), "organization");
    expect(theirs.accountId).not.toBe((await acmeRow()).id);
    await expect(accounts.summary(ac(MEMBER), "organization")).rejects.toThrow(/no active organization/);
  });

  it("gives a person their own account, apart from the organization's", async () => {
    const mine = await both.payment.services.accounts.summary(ac(MEMBER, ORG_A), "account");
    expect(mine.accountId).not.toBe((await acmeRow()).id);
    await expect(both.payment.services.accounts.payments(ac(MEMBER, ORG_A), "organization", { page: 1, pageSize: 10 })).rejects.toThrow(/forbidden/);
  });

  it("checkout stands on the same proof and creates the Customer once", async () => {
    const { billing } = both.payment.services;
    await expect(billing.checkout(ac(MEMBER, ORG_A), "organization", { bundleKey: "small" })).rejects.toThrow(/forbidden/);
    const first = await billing.checkout(ac(OWNER, ORG_A), "organization", { bundleKey: "small" });
    const second = await billing.checkout(ac(OWNER, ORG_A), "organization", { planKey: "starter" });
    expect(first.url).toContain("checkout.stripe.test/bundle/small");
    expect(second.url).toContain("checkout.stripe.test/plan/starter");
    expect(provider.calls.filter((c) => c.method === "ensureCustomer")).toHaveLength(1);
    expect((await acmeRow()).stripeCustomerId).toBe(`cus_${(await acmeRow()).id}`);
  });

  it("refuses a webhook whose signature does not verify, claiming nothing", async () => {
    const res = await post("/api/webhooks/stripe", "{}", "forged");
    expect(res.status).toBe(400);
    expect(await db.select().from(paymentStripeEvent)).toHaveLength(0);
  });

  it("writes one row in each ledger for a paid bundle; the replay is a 200 that writes nothing", async () => {
    const body = await bundleEvent("evt_bundle", "cs_1", "pi_1");
    const first = await post("/api/webhooks/stripe", body, "valid");
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ received: true, status: "processed", kind: "checkout_paid" });

    const replay = await post("/api/webhooks/stripe", body, "valid");
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({ status: "duplicate" });
    const topUps = (await acmeLots()).filter((l) => l.reason === "top_up");
    expect(topUps.map((l) => [l.amount, l.remaining, l.expiresAt, l.sourceRef])).toEqual([[1000, 1000, null, "cs_1"]]);
    expect(await balance()).toBe(1500);

    const payments = await both.payment.services.accounts.payments(ac(OWNER, ORG_A), "organization", { page: 1, pageSize: 10 });
    expect(payments.rows.map((p) => [p.kind, p.amount, p.currency, p.description, p.creditsGranted])).toEqual([["bundle", 1000, "eur", "Bought Small", 1000]]);
  });

  it("commits both ledgers or neither: a payment row that cannot be written takes the credits with it", async () => {
    const lotsBefore = (await acmeLots()).length;
    const account = await acmeRow();
    // the credits are written first, in the webhook's transaction; then the money row fails
    const original = both.payment.services.payments.record.bind(both.payment.services.payments);
    both.payment.services.payments.record = async () => { throw new Error("the payment ledger is down"); };
    const body = await bundleEvent("evt_broken", "cs_broken", "pi_broken");
    const res = await post("/api/webhooks/stripe", body, "valid");
    both.payment.services.payments.record = original;

    expect(res.status).toBe(500);
    expect(await acmeLots()).toHaveLength(lotsBefore);
    expect(await db.select().from(creditLot).where(eq(creditLot.sourceRef, "cs_broken"))).toEqual([]);
    expect(await db.select().from(paymentStripeEvent).where(eq(paymentStripeEvent.id, "evt_broken"))).toEqual([]);
    expect(await db.select().from(paymentLedger).where(and(eq(paymentLedger.accountId, account.id), eq(paymentLedger.stripeRef, "cs_broken")))).toEqual([]);

    // the provider's retry lands both
    expect((await post("/api/webhooks/stripe", body, "valid")).status).toBe(200);
    expect(await db.select().from(creditLot).where(eq(creditLot.sourceRef, "cs_broken"))).toHaveLength(1);
    expect(await db.select().from(paymentLedger).where(eq(paymentLedger.stripeRef, "cs_broken"))).toHaveLength(1);
  });

  it("a refund writes the money row and takes back what is left of the credits", async () => {
    await both.credits.metering.charge({ organizationId: ORG_A }, { service: "assistant", units: 1, ref: "spent-early", userId: MEMBER });
    const refund = FakeProvider.body({ id: "evt_r1", type: "charge.refunded", kind: "charge_refunded", paymentIntentId: "pi_broken", amountRefunded: 500 });
    expect((await post("/api/webhooks/stripe", refund, "valid")).status).toBe(200);

    const [lot] = await db.select().from(creditLot).where(eq(creditLot.sourceRef, "cs_broken"));
    expect(lot.remaining).toBe(500);
    const [taken] = await db.select().from(creditLedger).where(and(eq(creditLedger.reason, "take_back"), eq(creditLedger.lotId, lot.id)));
    expect(taken).toMatchObject({ delta: -500, sourceEventId: "evt_r1" });
    const [row] = await db.select().from(paymentLedger).where(eq(paymentLedger.stripeRef, "evt_r1"));
    expect(row).toMatchObject({ kind: "refund", amount: -500, description: "Refund: Bought Small" });
  });

  it("rolls the claim back when a handler throws, so the provider's retry can succeed; the invoice lands in both ledgers", async () => {
    const acme = await acmeRow();
    const body = FakeProvider.body({
      id: "evt_invoice", type: "invoice.paid", kind: "invoice_paid", invoiceId: "in_1", subscriptionId: "sub_1", customerId: null, amountPaid: 1900, currency: "eur", billingReason: "subscription_create",
    });
    // the fake knows no sub_1 yet: the handler throws, the claim must not stay
    const failed = await post("/api/webhooks/stripe", body, "valid");
    expect(failed.status).toBe(500);
    expect(await db.select().from(paymentStripeEvent).where(eq(paymentStripeEvent.id, "evt_invoice"))).toHaveLength(0);

    provider.subscriptions.set("sub_1", { id: "sub_1", status: "active", priceId: "price_starter", currentPeriodEnd: new Date("2026-03-12T00:00:00.000Z"), accountId: acme.id, customerId: null });
    const retried = await post("/api/webhooks/stripe", body, "valid");
    expect(retried.status).toBe(200);
    expect(await acmeRow()).toMatchObject({ planKey: "starter", subscriptionStatus: "active" });
    const plan = (await acmeLots()).filter((l) => l.reason === "plan");
    expect(plan.map((l) => [l.amount, l.remaining, l.expiresAt?.toISOString()])).toEqual([[2000, 2000, "2026-03-12T00:00:00.000Z"]]);
    expect(await db.select().from(paymentStripeEvent).where(eq(paymentStripeEvent.id, "evt_invoice"))).toHaveLength(1);
    expect((await acmeCredits()).priceList).toBe("starter");
    const [row] = await db.select().from(paymentLedger).where(eq(paymentLedger.stripeRef, "in_1"));
    expect(row).toMatchObject({ kind: "subscription", amount: 1900, description: "Subscribed to Starter", paymentIntentId: "pi_in_1", creditsGranted: 2000 });
  });

  it("answers 400 on the connect endpoint too when the signature does not verify", async () => {
    const res = await post("/api/webhooks/stripe/connect", "{}", "forged");
    expect(res.status).toBe(400);
  });
});
