/**
 * Vendor credits on a REAL Postgres (PGlite) with the REAL access-control
 * config, engine and gate, plus the fake payment provider:
 *   - only the vendor's own billing managers settle its sales in credits or
 *     give promotions; a credit refund is a lot at the buyer, at that vendor
 *     only (UC122, UC127, UC131)
 *   - a money refund made in Stripe after a credit refund is still mirrored:
 *     no database rule may refuse a fact Stripe already holds
 *   - paying in full with those credits stands on the buyer's billing custody,
 *     moves no money, and short credits roll the whole buy back (UC133, UC135,
 *     UC136)
 *   - the vendor reads what it issued and still owes (UC134)
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { FakeProvider } from "@modules/payment/api";
import { creditAccount, creditLot } from "@modules/credits/models";
import { paymentAccount, paymentPurchase } from "@modules/payment/models";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyMigrations, mountBoth } from "./support";

const ALPHA = "org-a";
const BRAVO = "org-b";
const ALPHA_OWNER = "u-owner-a";
const ALPHA_MANAGER = "u-mgr-a";
const ALPHA_MEMBER = "u-std-a";
const BRAVO_OWNER = "u-owner-b";

describe("payment vendor credits (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let provider: FakeProvider;
  let payment: ReturnType<typeof mountBoth>["payment"];
  let credits: ReturnType<typeof mountBoth>["credits"];
  let app: Hono;
  let productId: string;
  let cardPurchaseId: string;

  const ac = (userId: string, activeOrgId: string | null = null): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, activeOrgId);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  const accountOf = async (organizationId: string) => (await db.select().from(paymentAccount).where(eq(paymentAccount.organizationId, organizationId)))[0];
  const creditsOf = async (organizationId: string) => (await db.select().from(creditAccount).where(eq(creditAccount.organizationId, organizationId)))[0];
  const connect = (body: string) =>
    app.request("/api/webhooks/stripe/connect", { method: "POST", headers: { "stripe-signature": "valid", "content-type": "application/json" }, body });
  const buy = { scope: "organization" as const, quantity: 1 };

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyMigrations(db.$client);
    gate = makeGate(db, engine);
    provider = new FakeProvider();
    ({ payment, credits } = mountBoth(db, engine, provider));
    app = new Hono().route(payment.webhookMount!.basePath, payment.webhookMount!.router);

    // Bravo sells Mix review at €49.00, refundable in money or credits; Alpha buys one by card
    const { selling } = payment.services;
    await selling.onboarding(ac(BRAVO_OWNER, BRAVO));
    const bravo = await accountOf(BRAVO);
    provider.accounts.set(bravo.stripeAccountId as string, { chargesEnabled: true });
    await selling.status(ac(BRAVO_OWNER, BRAVO));
    productId = (await selling.createProduct(ac(BRAVO_OWNER, BRAVO), { name: "Mix review", unitAmount: 4900, currency: "eur", refundPolicy: "either" })).id;
    // Alpha also holds its €5.00 of welcome credits: platform credits, which must never pay a vendor
    await credits.welcome.organization(ALPHA);
    await payment.services.accounts.ensure(db, { organizationId: ALPHA });
    const alpha = await accountOf(ALPHA);
    await connect(
      FakeProvider.body({
        id: "evt_sale", type: "checkout.session.completed", kind: "checkout_paid", connectedAccountId: bravo.stripeAccountId,
        session: {
          id: "cs_sale", mode: "payment", paymentStatus: "paid", paymentIntentId: "pi_sale", amountTotal: 4900, currency: "eur",
          metadata: { kind: "purchase", accountId: alpha.id, buyerUserId: ALPHA_OWNER, productId, quantity: "1", feeAmount: "490" },
        },
      }),
    );
    cardPurchaseId = (await db.select().from(paymentPurchase))[0].id;
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("lets only the vendor's billing managers settle its sale in credits, as a lot at the buyer for that vendor (UC122, UC127)", async () => {
    const { vendorCredits } = payment.services;
    await expect(vendorCredits.creditRefund(ac(ALPHA_OWNER, ALPHA), cardPurchaseId, { amount: 100 })).rejects.toThrow(/forbidden/);
    await expect(vendorCredits.creditRefund(ac(ALPHA_MEMBER, ALPHA), cardPurchaseId, { amount: 100 })).rejects.toThrow(/forbidden/);
    expect(await vendorCredits.creditRefund(ac(BRAVO_OWNER, BRAVO), cardPurchaseId, { amount: 2000 })).toMatchObject({ creditsRefunded: 2000, unsettled: 2900 });
    const alpha = await creditsOf(ALPHA);
    const lots = await db.select().from(creditLot).where(eq(creditLot.reason, "vendor_refund"));
    expect(lots.map((l) => [l.accountId, l.vendorOrganizationId, l.amount, l.issuedByUserId])).toEqual([[alpha.id, BRAVO, 2000, BRAVO_OWNER]]);
    expect(await credits.services.ledger.balances(db, alpha.id)).toEqual({ platform: 500, limited: [], vendors: [{ vendorOrganizationId: BRAVO, amount: 2000 }] });
  });

  it("still mirrors a money refund made in Stripe after a credit refund", async () => {
    const bravo = await accountOf(BRAVO);
    const refund = FakeProvider.body({ id: "evt_refund", type: "charge.refunded", kind: "charge_refunded", connectedAccountId: bravo.stripeAccountId, paymentIntentId: "pi_sale", amountRefunded: 4900 });
    expect((await connect(refund)).status).toBe(200);
    expect((await db.select().from(paymentPurchase).where(eq(paymentPurchase.id, cardPurchaseId)))[0]).toMatchObject({ refundedAmount: 4900, creditsRefunded: 2000 });
    await expect(payment.services.vendorCredits.creditRefund(ac(BRAVO_OWNER, BRAVO), cardPurchaseId, { amount: 1 })).rejects.toThrow(/settled/);
  });

  it("gives a promotion only from the vendor's own billing managers, only to its buyers (UC131)", async () => {
    const { vendorCredits, selling } = payment.services;
    const promotion = { owner: { organizationId: ALPHA }, amount: 8000, expiresAt: new Date(Date.now() + 90 * 86_400_000) };
    await expect(vendorCredits.promote(ac(ALPHA_MANAGER, ALPHA), promotion)).rejects.toThrow(/forbidden/);
    // Alpha bought (its purchase was refunded in full since, and still counts); its member never bought
    expect((await selling.buyers(ac(BRAVO_OWNER, BRAVO))).rows.map((b) => b.owner)).toEqual([{ organizationId: ALPHA }]);
    await expect(vendorCredits.promote(ac(BRAVO_OWNER, BRAVO), { ...promotion, owner: { userId: ALPHA_MEMBER } })).rejects.toThrow(/your buyers/);
    expect((await vendorCredits.promote(ac(BRAVO_OWNER, BRAVO), promotion)).lotId).toBeTruthy();
  });

  it("pays a product in full with the vendor's credits, for the buyer's billing managers only, moving no money (UC133, UC135)", async () => {
    const { marketplace } = payment.services;
    await expect(marketplace.payWithCredits(ac(ALPHA_MEMBER, ALPHA), { ...buy, productId })).rejects.toThrow(/forbidden/);
    const before = provider.calls.length;
    const { purchaseId } = await marketplace.payWithCredits(ac(ALPHA_OWNER, ALPHA), { ...buy, productId });
    expect((await db.select().from(paymentPurchase).where(eq(paymentPurchase.id, purchaseId)))[0]).toMatchObject({
      paidWith: "vendor_credits", amountTotal: 4900, applicationFeeAmount: 0, stripeCheckoutSessionId: null,
    });
    expect(provider.calls.length).toBe(before);
    // gifts first, soonest expiry first: the credit refund (6 months) outlives the promotion (90 days), so the promotion pays
    const alpha = await creditsOf(ALPHA);
    expect(await credits.services.ledger.balances(db, alpha.id)).toEqual({ platform: 500, limited: [], vendors: [{ vendorOrganizationId: BRAVO, amount: 5100 }] });
  });

  it("rolls the whole buy back when the credits fall short, and never spends platform credits on it (UC112, UC136)", async () => {
    const purchases = (await db.select().from(paymentPurchase)).length;
    await expect(payment.services.marketplace.payWithCredits(ac(ALPHA_OWNER, ALPHA), { ...buy, productId, quantity: 2 })).rejects.toThrow(/do not cover 9800 cents/);
    expect(await db.select().from(paymentPurchase)).toHaveLength(purchases);
    const alpha = await creditsOf(ALPHA);
    expect(await credits.services.ledger.balances(db, alpha.id)).toEqual({ platform: 500, limited: [], vendors: [{ vendorOrganizationId: BRAVO, amount: 5100 }] });
  });

  it("tells the vendor what it issued and who still holds it (UC134)", async () => {
    expect(await payment.services.vendorCredits.outstanding(ac(BRAVO_OWNER, BRAVO))).toMatchObject({
      issued: 10000, outstanding: 5100, holders: [{ owner: { organizationId: ALPHA }, remaining: 5100 }],
    });
    await expect(payment.services.vendorCredits.outstanding(ac(ALPHA_MEMBER, ALPHA))).rejects.toThrow(/forbidden/);
  });
});
