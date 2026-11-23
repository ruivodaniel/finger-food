/**
 * The marketplace on a REAL Postgres (PGlite) with the REAL access-control
 * config, engine and gate, plus the fake payment provider:
 *   - a company onboards as a vendor; it creates products only once Stripe
 *     can pay it; only its own billing managers change them (UC66–UC69)
 *   - the Marketplace lists active products; an archived one stays readable
 *     by id, withdrawn (UC74, UC75)
 *   - buying stands on the buyer's billing custody; a plain member cannot buy
 *     for the company (UC104)
 *   - the Connect endpoint: a paid session lands one purchase and its row on
 *     the payment ledger, and nothing in credits; a refund is mirrored; the
 *     buyer and the vendor each see it on their side and nobody else does
 *     (UC79, UC80, UC87, UC89, UC95, UC125)
 */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { FakeProvider } from "@modules/payment/api";
import { creditLedger } from "@modules/credits/models";
import { paymentAccount, paymentLedger, paymentPurchase } from "@modules/payment/models";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { hydrate, makeDb, makeEngine, makeGate, type Engine, type Gate, type TestDb } from "../access-control/harness";
import { applyMigrations, mountBoth } from "./support";

const ALPHA = "org-a";
const BRAVO = "org-b";
const ALPHA_OWNER = "u-owner-a";
const ALPHA_MANAGER = "u-mgr-a";
const ALPHA_MEMBER = "u-std-a";
const BRAVO_OWNER = "u-owner-b";

describe("payment marketplace (PGlite + real access control)", () => {
  let engine: Engine;
  let db: TestDb;
  let gate: Gate;
  let provider: FakeProvider;
  let payment: ReturnType<typeof mountBoth>["payment"];
  let app: Hono;
  let bravoProductId: string;

  const ac = (userId: string, activeOrgId: string | null = null): ScopedAcRequestContext => {
    const ctx = hydrate(engine, userId, activeOrgId);
    return { ...ctx, gateDb: gate(ctx.bag) };
  };
  const accountOf = async (organizationId: string) => (await db.select().from(paymentAccount).where(eq(paymentAccount.organizationId, organizationId)))[0];
  const connect = (body: string) =>
    app.request("/api/webhooks/stripe/connect", { method: "POST", headers: { "stripe-signature": "valid", "content-type": "application/json" }, body });

  /** Onboard a company and let Stripe enable it: what the vendor's owner does, then what Stripe reports. */
  async function vendor(userId: string, organizationId: string) {
    await payment.services.selling.onboarding(ac(userId, organizationId));
    const account = await accountOf(organizationId);
    provider.accounts.set(account.stripeAccountId as string, { chargesEnabled: true });
    expect(await payment.services.selling.status(ac(userId, organizationId))).toEqual({ hasAccount: true, chargesEnabled: true });
    return account.stripeAccountId as string;
  }

  beforeAll(async () => {
    engine = makeEngine();
    db = await makeDb();
    await applyMigrations(db.$client);
    gate = makeGate(db, engine);
    provider = new FakeProvider();
    ({ payment } = mountBoth(db, engine, provider));
    app = new Hono().route(payment.webhookMount!.basePath, payment.webhookMount!.router);
  });

  afterAll(async () => {
    await db.$client.close();
  });

  it("creates a product only once Stripe can pay the vendor, and only for its billing managers (UC66, UC69)", async () => {
    const selling = payment.services.selling;
    const product = { name: "Mix review", description: "One mix, three days.", unitAmount: 4900, currency: "eur", refundPolicy: "either" as const };
    await selling.onboarding(ac(BRAVO_OWNER, BRAVO));
    await expect(selling.createProduct(ac(BRAVO_OWNER, BRAVO), product)).rejects.toThrow(/has not confirmed/);
    await vendor(BRAVO_OWNER, BRAVO);
    const created = await selling.createProduct(ac(BRAVO_OWNER, BRAVO), product);
    expect(created).toMatchObject({ organizationId: BRAVO, unitAmount: 4900, refundPolicy: "either", active: true });
    bravoProductId = created.id;

    await expect(selling.createProduct(ac(ALPHA_MEMBER, ALPHA), product)).rejects.toThrow(/forbidden/);
    await expect(selling.createProduct(ac(ALPHA_MANAGER, ALPHA), product)).rejects.toThrow(/forbidden/);
    await expect(selling.createProduct(ac(BRAVO_OWNER, BRAVO), { ...product, currency: "usd" })).rejects.toThrow(/priced in eur/);
  });

  it("lets only the vendor's own billing managers change a product (UC67, UC68, UC69)", async () => {
    const selling = payment.services.selling;
    expect(await selling.updateProduct(ac(BRAVO_OWNER, BRAVO), bravoProductId, { unitAmount: 5900 })).toMatchObject({ unitAmount: 5900 });
    await expect(selling.updateProduct(ac(ALPHA_OWNER, ALPHA), bravoProductId, { unitAmount: 100 })).rejects.toThrow(/forbidden/);
    await expect(selling.updateProduct(ac(ALPHA_MEMBER, ALPHA), bravoProductId, { unitAmount: 100 })).rejects.toThrow(/forbidden/);
    expect((await selling.products(ac(BRAVO_OWNER, BRAVO))).rows.map((p) => p.id)).toEqual([bravoProductId]);
    expect((await selling.products(ac(ALPHA_OWNER, ALPHA))).rows).toEqual([]);
  });

  it("lists active products, and keeps an archived one readable as withdrawn (UC74, UC75, UC77)", async () => {
    const { selling, marketplace } = payment.services;
    expect((await marketplace.listing({ page: 1, pageSize: 10 })).rows.map((p) => p.name)).toEqual(["Mix review"]);
    await selling.updateProduct(ac(BRAVO_OWNER, BRAVO), bravoProductId, { active: false });
    expect((await marketplace.listing({ page: 1, pageSize: 10 })).rows).toEqual([]);
    expect(await marketplace.product(bravoProductId)).toMatchObject({ active: false, vendorCanTakePayments: true });
    await selling.updateProduct(ac(BRAVO_OWNER, BRAVO), bravoProductId, { active: true });
    expect((await marketplace.listing({ search: "mix", page: 1, pageSize: 10 })).total).toBe(1);
  });

  it("stands a buy on the buyer's billing custody (UC104)", async () => {
    const { marketplace } = payment.services;
    const buy = { productId: bravoProductId, quantity: 1, paidWith: "card" as const };
    await expect(marketplace.checkout(ac(ALPHA_MEMBER, ALPHA), { ...buy, scope: "organization" })).rejects.toThrow(/forbidden/);
    expect((await marketplace.checkout(ac(ALPHA_MEMBER, ALPHA), { ...buy, scope: "account" })).url).toContain("checkout.stripe.test/purchase/");
    expect((await marketplace.checkout(ac(ALPHA_OWNER, ALPHA), { ...buy, scope: "organization" })).url).toContain("checkout.stripe.test/purchase/");
    expect(provider.calls.filter((c) => c.method === "checkoutForPurchase").at(-1)?.input).toMatchObject({ accountId: (await accountOf(ALPHA)).id, unitAmount: 5900, feeAmount: 590 });
  });

  it("lands one purchase and one money row from the Connect endpoint, and mirrors the refund (UC82, UC95, UC125, UC89)", async () => {
    const alpha = await accountOf(ALPHA);
    const bravo = await accountOf(BRAVO);
    const body = FakeProvider.body({
      id: "evt_sale_1", type: "checkout.session.completed", kind: "checkout_paid", connectedAccountId: bravo.stripeAccountId,
      session: {
        id: "cs_sale_1", mode: "payment", paymentStatus: "paid", paymentIntentId: "pi_sale_1", amountTotal: 5900, currency: "eur",
        metadata: { kind: "purchase", accountId: alpha.id, buyerUserId: ALPHA_OWNER, productId: bravoProductId, quantity: "1", feeAmount: "590" },
      },
    });
    expect((await connect(body)).status).toBe(200);
    expect(await (await connect(body)).json()).toMatchObject({ status: "duplicate" });

    const purchases = await db.select().from(paymentPurchase);
    expect(purchases).toHaveLength(1);
    expect(purchases[0]).toMatchObject({ accountId: alpha.id, sellerOrganizationId: BRAVO, paidWith: "card", amountTotal: 5900, applicationFeeAmount: 590 });
    expect((await db.select().from(paymentLedger)).map((r) => [r.accountId, r.kind, r.amount, r.description])).toEqual([[alpha.id, "purchase", 5900, "Bought Mix review"]]);
    expect(await db.select().from(creditLedger)).toEqual([]);

    const refund = FakeProvider.body({ id: "evt_refund_1", type: "charge.refunded", kind: "charge_refunded", connectedAccountId: bravo.stripeAccountId, paymentIntentId: "pi_sale_1", amountRefunded: 2000 });
    expect((await connect(refund)).status).toBe(200);
    expect((await db.select().from(paymentPurchase))[0]).toMatchObject({ refundedAmount: 2000, applicationFeeAmount: 590 });
    expect((await db.select().from(paymentLedger).where(eq(paymentLedger.kind, "refund"))).map((r) => r.amount)).toEqual([-2000]);
  });

  it("shows the purchase to the buyer's billing managers and the sale to the vendor's, and to nobody else (UC79, UC80, UC87)", async () => {
    const { accounts, selling } = payment.services;
    expect((await accounts.purchases(ac(ALPHA_OWNER, ALPHA), "organization", { page: 1, pageSize: 10 })).rows.map((p) => [p.productName, p.refundedAmount])).toEqual([["Mix review", 2000]]);
    await expect(accounts.purchases(ac(ALPHA_MEMBER, ALPHA), "organization", { page: 1, pageSize: 10 })).rejects.toThrow(/forbidden/);
    expect((await accounts.purchases(ac(ALPHA_MEMBER, ALPHA), "account", { page: 1, pageSize: 10 })).rows).toEqual([]);
    expect((await selling.sales(ac(BRAVO_OWNER, BRAVO), { page: 1, pageSize: 10 })).rows.map((s) => s.buyer)).toEqual([{ organizationId: ALPHA }]);
    await vendor(ALPHA_OWNER, ALPHA);
    expect((await selling.sales(ac(ALPHA_OWNER, ALPHA), { page: 1, pageSize: 10 })).rows).toEqual([]);
  });

  it("mirrors account.updated onto the vendor", async () => {
    const bravo = await accountOf(BRAVO);
    const body = FakeProvider.body({ id: "evt_acct_1", type: "account.updated", kind: "account_updated", connectedAccountId: bravo.stripeAccountId, chargesEnabled: false });
    expect((await connect(body)).status).toBe(200);
    expect((await accountOf(BRAVO)).chargesEnabled).toBe(false);
  });
});
