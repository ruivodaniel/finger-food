/**
 * The marketplace against the fake provider, the in-memory repositories and
 * a fake credits ledger: vendor onboarding and status, the purchase checkout,
 * and what the Connect events do to purchases, the payment ledger and the
 * vendor mirror. Custody of an account is the account service's job (proven
 * on PGlite with the real engine, like the product gates); here it hands back
 * the scope's account.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceService } from "./marketplace.service";
import { PaymentLedgerService } from "./payment-ledger.service";
import { SellingService } from "./selling.service";
import { VendorCreditsService } from "./vendor-credits.service";
import { WebhookService } from "./webhook.service";
import { FakeCredits } from "../testing/fake-credits";
import { FakeProvider, type DistributiveOmit, type FakeWebhookBody } from "../testing/fake-provider";
import {
  InMemoryPaymentAccountRepository,
  InMemoryPaymentLedgerRepository,
  InMemoryProductRepository,
  InMemoryPurchaseRepository,
  InMemoryStripeEventRepository,
  FAKE_TX,
  NO_ENGINE,
  fakePeople,
  nextId,
  runInFakeTransaction,
  silentLogger,
  testErrors,
} from "../testing/in-memory-repos";
import { PayWithCreditsSchema, PurchaseCheckoutSchema } from "../models/payment.schemas";
import type { CheckoutSessionFacts } from "../stripe/provider";
import type { BillingScope, PaymentOwner } from "../../shared/types";
import type { PaymentCatalog } from "../../shared/catalog";

const catalog: Pick<PaymentCatalog, "marketplace" | "vendorCredits"> = {
  marketplace: { platformFeePercent: 10, sellerOrgTypes: ["company"], sellerCountry: "pt", currencies: ["eur"] },
  vendorCredits: { refundExpiresInDays: 180 },
};

/** A signed-in person acting in an organization (or none). */
const as = (userId: string, organization: { id: string; type: string } | null = null) =>
  ({ bag: { session: { user: { id: userId }, organization } }, roles: [], permissions: [] }) as unknown as ScopedAcRequestContext;
const OLIVIA_AT_ACME = as("u-olivia", { id: "o-acme", type: "company" });
const JOHN_AT_BOREALIS = as("u-john", { id: "o-borealis", type: "company" });

type Delivery = DistributiveOmit<FakeWebhookBody, "id" | "type"> & { id?: string; type?: string };

async function stack(opts: { provider?: boolean } = {}) {
  const accountRepo = new InMemoryPaymentAccountRepository();
  const paymentRepo = new InMemoryPaymentLedgerRepository();
  const productRepo = new InMemoryProductRepository();
  const purchaseRepo = new InMemoryPurchaseRepository(accountRepo);
  const eventRepo = new InMemoryStripeEventRepository();
  const provider = opts.provider === false ? null : new FakeProvider();
  const credits = new FakeCredits();
  const payments = new PaymentLedgerService({ ledgerRepo: paymentRepo, accountRepo, credits, createId: nextId, logger: silentLogger });
  // custody stubbed: the scope's account, created on first sight
  const accounts = {
    requireManageable: async (ac: ScopedAcRequestContext, scope: BillingScope) => {
      const owner: PaymentOwner = scope === "organization" ? { organizationId: ac.bag.session.organization!.id } : { userId: ac.bag.session.user.id };
      return { account: await accountRepo.ensure(FAKE_TX, nextId("acc"), owner), owner };
    },
  };
  const completed = vi.fn();
  const common = { accountRepo, productRepo, purchaseRepo, accounts, provider, catalog, db: FAKE_TX, webAppUrl: "https://app.test", createId: nextId, errors: testErrors, logger: silentLogger, people: fakePeople() };
  const selling = new SellingService({ ...common, engine: NO_ENGINE });
  const marketplace = new MarketplaceService({ ...common, credits, payments, hooks: { onPurchaseCompleted: completed }, runInTransaction: runInFakeTransaction });
  const vendorCredits = new VendorCreditsService({
    selling, accountRepo, credits, productRepo, purchaseRepo,
    catalog, db: FAKE_TX, runInTransaction: runInFakeTransaction, createId: nextId, errors: testErrors, people: common.people,
  });
  const webhook = provider
    ? new WebhookService({
        provider, eventRepo, runInTransaction: runInFakeTransaction, logger: silentLogger,
        handlers: {
          checkout_paid: (tx, e) => marketplace.onPurchasePaid(tx, e),
          charge_refunded: async (tx, e) => { await marketplace.onChargeRefunded(tx, e); await payments.onChargeRefunded(tx, e); },
          account_updated: (tx, e) => selling.onAccountUpdated(tx, e),
        },
      })
    : null;

  // Borealis can take payments and sells Mix review; Acme buys
  const borealis = await accountRepo.ensure(FAKE_TX, nextId("acc"), { organizationId: "o-borealis" });
  await accountRepo.patchStripe(FAKE_TX, borealis.id, { stripeAccountId: "acct_borealis", chargesEnabled: true });
  const acme = await accountRepo.ensure(FAKE_TX, nextId("acc"), { organizationId: "o-acme" });
  const mix = await productRepo.insert(FAKE_TX, {
    id: "p-mix", organizationId: "o-borealis", name: "Mix review", description: "One mix, three days.", unitAmount: 4900, currency: "eur", refundPolicy: "either",
  });

  let evt = 0;
  const deliver = (body: Delivery) =>
    webhook!.handle("connect", FakeProvider.body({ id: `evt_${++evt}`, type: body.kind, connectedAccountId: "acct_borealis", ...body } as FakeWebhookBody), "valid");
  const session = (over: Partial<CheckoutSessionFacts> = {}): CheckoutSessionFacts => ({
    id: "cs_1", mode: "payment", paymentStatus: "paid", paymentIntentId: "pi_1", amountTotal: 9800, currency: "eur",
    metadata: { kind: "purchase", accountId: acme.id, buyerUserId: "u-olivia", productId: mix.id, quantity: "2", feeAmount: "980" }, ...over,
  });
  const paid = (over: Partial<CheckoutSessionFacts> = {}, event: Partial<Delivery> = {}) =>
    deliver({ kind: "checkout_paid", type: "checkout.session.completed", session: session(over), ...event } as Delivery);
  /** an earlier purchase from Borealis, straight into the table — what makes the owner one of its buyers */
  const bought = async (owner: PaymentOwner) => {
    const account = await accountRepo.ensure(FAKE_TX, nextId("acc"), owner);
    await purchaseRepo.insertCredits(FAKE_TX, {
      id: nextId("pur"), accountId: account.id, sellerOrganizationId: "o-borealis", productId: mix.id, productName: mix.name, quantity: 1, amountTotal: 4900, currency: "eur",
    });
  };

  return { accountRepo, paymentRepo, productRepo, purchaseRepo, eventRepo, provider, credits, selling, marketplace, vendorCredits, webhook, borealis, acme, mix, completed, deliver, paid, bought };
}

beforeEach(() => { vi.setSystemTime(new Date("2026-02-15T15:20:00.000Z")); });

describe("vendor onboarding and status", () => {
  it("creates the connected account once and links back to Selling (UC62, UC63)", async () => {
    const s = await stack();
    const first = await s.selling.onboarding(OLIVIA_AT_ACME);
    const again = await s.selling.onboarding(OLIVIA_AT_ACME);
    expect(first.url).toBe(again.url);
    const created = s.provider!.calls.filter((c) => c.method === "createSellerAccount");
    expect(created).toHaveLength(1);
    // Stripe opens the vendor's account in the catalog's seller country
    expect(created[0]!.input).toMatchObject({ country: "pt" });
    expect(s.provider!.calls.find((c) => c.method === "onboardingLink")?.input).toMatchObject({
      returnUrl: "https://app.test/organizations/o-acme/selling?onboarding=return",
      refreshUrl: "https://app.test/organizations/o-acme/selling?onboarding=refresh",
    });
  });

  it("reads whether the vendor can take payments from Stripe and mirrors it (UC63)", async () => {
    const s = await stack();
    expect(await s.selling.status(OLIVIA_AT_ACME)).toEqual({ hasAccount: false, chargesEnabled: false });
    await s.selling.onboarding(OLIVIA_AT_ACME);
    expect(await s.selling.status(OLIVIA_AT_ACME)).toEqual({ hasAccount: true, chargesEnabled: false });
    s.provider!.accounts.set("acct_" + (await s.accountRepo.findByOwner(FAKE_TX, { organizationId: "o-acme" }))!.id, { chargesEnabled: true });
    expect(await s.selling.status(OLIVIA_AT_ACME)).toEqual({ hasAccount: true, chargesEnabled: true });
    expect((await s.accountRepo.findByOwner(FAKE_TX, { organizationId: "o-acme" }))!.chargesEnabled).toBe(true);
  });

  it("opens the Express dashboard only once there is an account (UC65)", async () => {
    const s = await stack();
    await expect(s.selling.dashboard(OLIVIA_AT_ACME)).rejects.toThrow(/start Stripe onboarding first/);
    expect(await s.selling.dashboard(JOHN_AT_BOREALIS)).toEqual({ url: "https://connect.stripe.test/dashboard/acct_borealis" });
  });

  it("refuses an organization type the catalog does not let sell, and is unavailable without a provider", async () => {
    const s = await stack();
    await expect(s.selling.onboarding(as("u-sam", { id: "o-platform", type: "platform_admin" }))).rejects.toThrow(/does not sell/);
    const off = await stack({ provider: false });
    await expect(off.selling.onboarding(OLIVIA_AT_ACME)).rejects.toThrow(/unavailable/);
  });

  it("mirrors account.updated from the Connect endpoint", async () => {
    const s = await stack();
    await s.deliver({ kind: "account_updated", chargesEnabled: false });
    expect((await s.accountRepo.findById(FAKE_TX, s.borealis.id))!.chargesEnabled).toBe(false);
  });
});

describe("checkout", () => {
  it("prices from the product, on the vendor's account, with the platform fee, back to the product page (UC70, UC71, UC78)", async () => {
    const s = await stack();
    expect(await s.marketplace.checkout(OLIVIA_AT_ACME, { scope: "organization", productId: "p-mix", quantity: 2, paidWith: "card" })).toEqual({
      url: "https://checkout.stripe.test/purchase/1",
    });
    expect(s.provider!.calls.at(-1)).toMatchObject({
      method: "checkoutForPurchase",
      input: {
        connectedAccountId: "acct_borealis", accountId: s.acme.id, buyerUserId: "u-olivia", productId: "p-mix",
        unitAmount: 4900, currency: "eur", quantity: 2, feeAmount: 980,
        successUrl: "https://app.test/marketplace/p-mix?checkout=success", cancelUrl: "https://app.test/marketplace/p-mix?checkout=cancel",
      },
    });
  });

  it("never reads a price from the request, and refuses a payment in platform credits (UC73, UC113)", () => {
    const tampered = PurchaseCheckoutSchema.parse({ scope: "account", productId: "p-mix", amount: 100, feeAmount: 0 });
    expect(tampered).toEqual({ scope: "account", productId: "p-mix", quantity: 1, paidWith: "card" });
    expect(PurchaseCheckoutSchema.safeParse({ scope: "organization", productId: "p-mix", paidWith: "platform_credits" }).success).toBe(false);
  });

  it("refuses a vendor that cannot take payments, and says so on the product (UC64)", async () => {
    const s = await stack();
    await s.accountRepo.patchStripe(FAKE_TX, s.borealis.id, { chargesEnabled: false });
    await expect(s.marketplace.checkout(OLIVIA_AT_ACME, { scope: "organization", productId: "p-mix", quantity: 1, paidWith: "card" })).rejects.toThrow(/cannot take payments/);
    expect(await s.marketplace.product("p-mix")).toMatchObject({ active: true, vendorCanTakePayments: false });
    expect(s.provider!.calls).toHaveLength(0);
  });

  it("refuses a vendor buying its own product (UC91) and a withdrawn product (UC75)", async () => {
    const s = await stack();
    await expect(s.marketplace.checkout(JOHN_AT_BOREALIS, { scope: "organization", productId: "p-mix", quantity: 1, paidWith: "card" })).rejects.toThrow(/its own product/);
    await s.productRepo.patch(FAKE_TX, "p-mix", { active: false });
    await expect(s.marketplace.checkout(OLIVIA_AT_ACME, { scope: "organization", productId: "p-mix", quantity: 1, paidWith: "card" })).rejects.toThrow(/no longer for sale/);
    expect(await s.marketplace.product("p-mix")).toMatchObject({ active: false });
    expect((await s.marketplace.listing({ page: 1, pageSize: 10 })).rows).toEqual([]);
    expect(s.provider!.calls).toHaveLength(0);
  });

  it("answers a Stripe refusal as a vendor that cannot take payments", async () => {
    const s = await stack();
    s.provider!.checkoutForPurchase = async () => { throw new Error("account cannot accept payments"); };
    await expect(s.marketplace.checkout(OLIVIA_AT_ACME, { scope: "organization", productId: "p-mix", quantity: 1, paidWith: "card" })).rejects.toThrow(/bad request: this vendor cannot take payments/);
  });
});

describe("names", () => {
  it("names the vendor and the buyer through the user-organization slice, and falls back to the id", async () => {
    const s = await stack();
    const people = fakePeople({ organizations: { "o-borealis": "Borealis Labs" } });
    const named = new MarketplaceService({
      accountRepo: s.accountRepo, productRepo: s.productRepo, purchaseRepo: s.purchaseRepo, credits: s.credits, payments: { record: async () => {} }, accounts: { requireManageable: async () => { throw new Error("unused"); } },
      provider: s.provider, catalog, hooks: {}, db: FAKE_TX, runInTransaction: runInFakeTransaction, webAppUrl: "https://app.test", createId: nextId, errors: testErrors, logger: silentLogger, people,
    });
    expect((await named.listing({ page: 1, pageSize: 10 })).rows.map((p) => p.vendorName)).toEqual(["Borealis Labs"]);
    expect((await named.product("p-mix")).vendorName).toBe("Borealis Labs");
    await s.paid();
    const sales = await s.selling.sales(JOHN_AT_BOREALIS, { page: 1, pageSize: 10 });
    expect(sales.rows[0]).toMatchObject({ buyerName: "o-acme", sellerName: "o-borealis" }); // the stack names every id by itself
  });
});

describe("the purchase event", () => {
  it("records the purchase born paid, for the buyer alone, and tells the app (UC82, UC104, UC78)", async () => {
    const s = await stack();
    expect(await s.paid()).toEqual({ status: "processed", kind: "checkout_paid" });
    expect(s.purchaseRepo.rows).toHaveLength(1);
    expect(s.purchaseRepo.rows[0]).toMatchObject({
      accountId: s.acme.id, sellerOrganizationId: "o-borealis", productName: "Mix review", quantity: 2, paidWith: "card",
      amountTotal: 9800, currency: "eur", applicationFeeAmount: 980, stripeCheckoutSessionId: "cs_1", stripePaymentIntentId: "pi_1",
    });
    expect(s.completed).toHaveBeenCalledWith({ purchaseId: s.purchaseRepo.rows[0].id, sellerOrganizationId: "o-borealis", owner: { organizationId: "o-acme" } });
  });

  it("puts the money on the buyer's payment ledger and writes nothing in credits (UC125, UC126)", async () => {
    const s = await stack();
    await s.paid();
    expect(s.paymentRepo.rows.map((r) => [r.accountId, r.kind, r.amount, r.currency, r.description, r.stripeRef, r.paymentIntentId, r.creditsGranted])).toEqual([
      [s.acme.id, "purchase", 9800, "eur", "Bought Mix review", "cs_1", "pi_1", 0],
    ]);
    expect(s.credits.moves).toEqual([]);
    expect(s.credits.lots).toEqual([]);
  });

  it("records a sale outside the platform currency the same way", async () => {
    const s = await stack();
    await s.paid({ currency: "usd" });
    expect(s.paymentRepo.rows.map((r) => [r.amount, r.currency])).toEqual([[9800, "usd"]]);
  });

  it("records one purchase per session, whatever is redelivered (UC95, UC83)", async () => {
    const s = await stack();
    await s.paid({}, { id: "evt_paid" });
    expect(await s.paid({}, { id: "evt_paid" })).toEqual({ status: "duplicate" });
    await s.paid({}, { type: "checkout.session.async_payment_succeeded" });
    expect(s.purchaseRepo.rows).toHaveLength(1);
    expect(s.paymentRepo.rows).toHaveLength(1);
    expect(s.completed).toHaveBeenCalledTimes(1);
  });

  it("ignores an unpaid session and a session paid on an account that is not the vendor's", async () => {
    const s = await stack();
    await s.paid({ paymentStatus: "unpaid" });
    await s.paid({ id: "cs_2" }, { connectedAccountId: "acct_someone_else" });
    expect(s.purchaseRepo.rows).toHaveLength(0);
    expect(s.eventRepo.rows).toHaveLength(2); // claimed all the same: nothing to retry
  });

  it("mirrors a refund made in the vendor's dashboard; the fee stays the platform's (UC89, UC90, UC92)", async () => {
    const s = await stack();
    await s.paid();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 4900 });
    expect(s.purchaseRepo.rows[0]).toMatchObject({ refundedAmount: 4900, applicationFeeAmount: 980, refundedAt: new Date() });
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 9800 });
    expect(s.purchaseRepo.rows[0].refundedAmount).toBe(9800);
    expect(s.paymentRepo.rows.map((r) => [r.kind, r.amount])).toEqual([["purchase", 9800], ["refund", -4900], ["refund", -4900]]);
    expect(s.credits.moves).toEqual([]);
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_unknown", amountRefunded: 100 });
    expect(s.purchaseRepo.rows).toHaveLength(1);
    expect(s.paymentRepo.rows).toHaveLength(3);
  });

  it("lists the sale among the vendor's sales only, naming the buyer (UC79, UC80)", async () => {
    const s = await stack();
    await s.paid();
    const sales = await s.selling.sales(JOHN_AT_BOREALIS, { page: 1, pageSize: 10 });
    expect(sales.rows.map((r) => [r.productName, r.buyer, r.amountTotal])).toEqual([["Mix review", { organizationId: "o-acme" }, 9800]]);
    expect((await s.selling.sales(OLIVIA_AT_ACME, { page: 1, pageSize: 10 })).rows).toEqual([]);
  });

  it("names each of the vendor's buyers once, the latest first", async () => {
    const s = await stack();
    await s.paid();
    await s.bought({ userId: "u-nadia" });
    await s.bought({ organizationId: "o-acme" });
    expect((await s.selling.buyers(JOHN_AT_BOREALIS)).rows).toEqual([
      { owner: { organizationId: "o-acme" }, name: "o-acme" },
      { owner: { userId: "u-nadia" }, name: "u-nadia" },
    ]);
    expect((await s.selling.buyers(OLIVIA_AT_ACME)).rows).toEqual([]);
  });
});

describe("vendor credits", () => {
  const ORG_BUY = { scope: "organization" as const, productId: "p-mix", quantity: 2 };
  const purchaseId = (s: Awaited<ReturnType<typeof stack>>) => s.purchaseRepo.rows[0].id;

  it("settles a card purchase in Borealis credits at Acme, expiring with the catalog's default; Acme's platform balance is unchanged (UC122, UC127)", async () => {
    const s = await stack();
    await s.paid();
    expect(await s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 9800 })).toEqual({ purchaseId: purchaseId(s), creditsRefunded: 9800, unsettled: 0 });
    const lot = s.credits.lots.find((l) => l.reason === "vendor_refund")!;
    expect(lot).toMatchObject({ owner: { organizationId: "o-acme" }, vendorOrganizationId: "o-borealis", amount: 9800, remaining: 9800, issuedByUserId: "u-john", ref: purchaseId(s) });
    expect(lot.expiresAt).toEqual(new Date("2026-08-14T15:20:00.000Z"));
    expect(s.credits.moves.at(-1)).toMatchObject({ reason: "grant", delta: 9800 });
    expect(s.credits.balance({ organizationId: "o-acme" }, new Date())).toBe(0);
    // no money moved: the payment ledger still holds only the card payment
    expect(s.paymentRepo.rows.map((r) => r.kind)).toEqual(["purchase"]);
  });

  it("refuses a credit refund when the product is refunded in money only (UC128)", async () => {
    const s = await stack();
    await s.paid();
    await s.productRepo.patch(FAKE_TX, "p-mix", { refundPolicy: "money" });
    await expect(s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 100 })).rejects.toThrow(/money only/);
    expect(s.credits.lots.filter((l) => l.reason === "vendor_refund")).toEqual([]);
  });

  it("settles in parts, never above what is unsettled, money refunds counted (UC129)", async () => {
    const s = await stack();
    await s.paid();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 1800 });
    expect((await s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 4000 })).unsettled).toBe(4000);
    await expect(s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 4001 })).rejects.toThrow(/at most 4000 cents/);
    expect((await s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 4000 })).unsettled).toBe(0);
    await expect(s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 1 })).rejects.toThrow(/settled/);
    expect(s.credits.lots.filter((l) => l.reason === "vendor_refund")).toHaveLength(2);
  });

  it("refuses to settle another vendor's sale", async () => {
    const s = await stack();
    await s.paid();
    await expect(s.vendorCredits.creditRefund(OLIVIA_AT_ACME, purchaseId(s), { amount: 100 })).rejects.toThrow(/forbidden/);
  });

  it("gives a promotion to a buyer with the vendor's expiry; refuses a past expiry, itself, a non-buyer and an owner gone since (UC131)", async () => {
    const s = await stack();
    await s.paid();
    const { lotId } = await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 6000, expiresAt: new Date("2026-05-15T00:00:00.000Z") });
    expect(s.credits.lots.find((l) => l.id === lotId)).toMatchObject({ owner: { organizationId: "o-acme" }, reason: "promotion", vendorOrganizationId: "o-borealis", amount: 6000 });
    await expect(s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 1, expiresAt: new Date("2026-01-01") })).rejects.toThrow(/in the future/);
    await expect(s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-borealis" }, amount: 1, expiresAt: new Date("2026-05-15") })).rejects.toThrow(/to itself/);
    await expect(s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { userId: "u-nadia" }, amount: 1, expiresAt: new Date("2026-05-15") })).rejects.toThrow(/your buyers/);
    // a refunded purchase still makes a buyer
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 9800 });
    expect((await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 1, expiresAt: new Date("2026-05-15") })).lotId).toBeTruthy();
    // Acme bought, but its organization is gone since
    const gone = new VendorCreditsService({
      selling: s.selling, accountRepo: s.accountRepo, credits: s.credits, productRepo: s.productRepo, purchaseRepo: s.purchaseRepo,
      catalog, db: FAKE_TX, runInTransaction: runInFakeTransaction, createId: nextId, errors: testErrors,
      people: fakePeople({ organizations: {} }),
    });
    await expect(gone.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 1, expiresAt: new Date("2026-05-15") })).rejects.toThrow(/no such billing owner/);
  });

  it("tells the vendor what it issued and who still holds its credits (UC134)", async () => {
    const s = await stack();
    await s.paid();
    await s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, purchaseId(s), { amount: 4900 });
    await s.bought({ userId: "u-nadia" });
    await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { userId: "u-nadia" }, amount: 1000, expiresAt: new Date("2026-05-15T00:00:00.000Z") });
    const view = await s.vendorCredits.outstanding(JOHN_AT_BOREALIS);
    expect(view).toMatchObject({ currency: "eur", issued: 5900, outstanding: 5900 });
    expect(view.holders.map((h) => [h.owner, h.remaining, h.soonestExpiry])).toEqual([
      [{ organizationId: "o-acme" }, 4900, "2026-08-14T15:20:00.000Z"],
      [{ userId: "u-nadia" }, 1000, "2026-05-15T00:00:00.000Z"],
    ]);
  });

  it("pays a product in full with Borealis credits: born paid, no fee, no Stripe, no money (UC133, UC135)", async () => {
    const s = await stack();
    await s.bought({ organizationId: "o-acme" });
    await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 10000, expiresAt: new Date("2026-05-15T00:00:00.000Z") });
    const { purchaseId: id } = await s.marketplace.payWithCredits(OLIVIA_AT_ACME, ORG_BUY);
    expect(s.purchaseRepo.rows.find((p) => p.id === id)).toMatchObject({
      accountId: s.acme.id, paidWith: "vendor_credits", amountTotal: 9800, applicationFeeAmount: 0, stripeCheckoutSessionId: null, stripePaymentIntentId: null,
    });
    expect(s.credits.moves.filter((m) => m.purchaseId === id).map((m) => [m.reason, m.delta, m.userId])).toEqual([["charge", -9800, "u-olivia"]]);
    expect(s.credits.lots[0].remaining).toBe(200);
    expect(s.provider!.calls).toHaveLength(0);
    expect(s.paymentRepo.rows).toEqual([]);
    expect(s.completed).toHaveBeenCalledWith({ purchaseId: id, sellerOrganizationId: "o-borealis", owner: { organizationId: "o-acme" } });
  });

  it("refuses the whole buy when the credits fall short, and writes nothing (UC136)", async () => {
    const s = await stack();
    await s.bought({ organizationId: "o-acme" });
    await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 4900, expiresAt: new Date("2026-05-15T00:00:00.000Z") });
    const before = s.credits.moves.length;
    await expect(s.marketplace.payWithCredits(OLIVIA_AT_ACME, ORG_BUY)).rejects.toThrow(/do not cover 9800 cents/);
    expect(s.credits.moves).toHaveLength(before);
    expect(s.credits.lots.find((l) => l.reason === "promotion")!.remaining).toBe(4900);
  });

  it("settles a purchase paid with credits in credits, whatever the product's policy (UC130)", async () => {
    const s = await stack();
    await s.productRepo.patch(FAKE_TX, "p-mix", { refundPolicy: "money" });
    await s.bought({ organizationId: "o-acme" });
    await s.vendorCredits.promote(JOHN_AT_BOREALIS, { owner: { organizationId: "o-acme" }, amount: 9800, expiresAt: new Date("2026-05-15T00:00:00.000Z") });
    const { purchaseId: id } = await s.marketplace.payWithCredits(OLIVIA_AT_ACME, ORG_BUY);
    expect((await s.vendorCredits.creditRefund(JOHN_AT_BOREALIS, id, { amount: 9800 })).unsettled).toBe(0);
  });

  it("never pays a vendor's product with platform credits, nor part credits part card (UC112, UC113, UC137)", async () => {
    const s = await stack();
    await s.credits.grant(FAKE_TX, { owner: { organizationId: "o-acme" }, reason: "top_up", amount: 50000 });
    await expect(s.marketplace.payWithCredits(OLIVIA_AT_ACME, ORG_BUY)).rejects.toThrow(/\(0 cents\)/);
    expect(PurchaseCheckoutSchema.safeParse({ scope: "organization", productId: "p-mix", paidWith: "vendor_credits" }).success).toBe(false);
    expect(PayWithCreditsSchema.safeParse({ scope: "organization", productId: "p-mix", cardAmount: 4900 }).success).toBe(false);
    expect(s.purchaseRepo.rows).toEqual([]);
  });
});
