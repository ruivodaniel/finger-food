/**
 * The billing service against the fake provider, the in-memory repositories
 * and a fake credits ledger: what each payment event does to the credits, the
 * payment ledger and the mirror, in every arrival order. Custody of the
 * account is the account service's job and is proven on PGlite with the real
 * engine; here it hands Acme's row back.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { describe, expect, it, vi } from "vitest";
import { BillingService } from "./billing.service";
import { PaymentLedgerService } from "./payment-ledger.service";
import { WebhookService } from "./webhook.service";
import { FakeCredits } from "../testing/fake-credits";
import { FakeProvider, type DistributiveOmit, type FakeWebhookBody } from "../testing/fake-provider";
import {
  InMemoryPaymentAccountRepository,
  InMemoryPaymentLedgerRepository,
  InMemoryStripeEventRepository,
  FAKE_TX,
  nextId,
  runInFakeTransaction,
  silentLogger,
  testErrors,
} from "../testing/in-memory-repos";
import { ProviderSignatureError, type CheckoutSessionFacts, type SubscriptionFacts } from "../stripe/provider";
import type { PaymentCatalog } from "../../shared/catalog";

const ACME = { organizationId: "o-acme" } as const;
const AC = {} as ScopedAcRequestContext; // custody is stubbed; nothing reads the context
const catalog: Pick<PaymentCatalog, "plans" | "bundles"> = {
  plans: [
    { key: "starter", name: "Starter", credits: 2000 },
    { key: "pro", name: "Pro", credits: 6000 },
  ],
  bundles: [{ key: "small", name: "Small", credits: 1000 }],
};
const priceIds = { starter: "price_starter", pro: "price_pro", small: "price_small" };
const MARCH = new Date("2026-03-12T00:00:00.000Z");
const APRIL = new Date("2026-04-12T00:00:00.000Z");

/** An event to deliver; the id and the type are filled in when left out. */
type Delivery = DistributiveOmit<FakeWebhookBody, "id" | "type"> & { id?: string; type?: string };

async function stack(opts: { provider?: boolean } = {}) {
  const accountRepo = new InMemoryPaymentAccountRepository();
  const paymentRepo = new InMemoryPaymentLedgerRepository();
  const eventRepo = new InMemoryStripeEventRepository();
  const provider = opts.provider === false ? null : new FakeProvider();
  const credits = new FakeCredits();
  const acme = await accountRepo.ensure(FAKE_TX, nextId("acc"), ACME);
  const pastDue = vi.fn();
  const accounts = { requireManageable: async () => ({ account: (await accountRepo.findById(FAKE_TX, acme.id))!, owner: ACME }) };
  const payments = new PaymentLedgerService({ ledgerRepo: paymentRepo, accountRepo, credits, createId: nextId, logger: silentLogger });
  const billing = new BillingService({
    accountRepo, accounts, credits, payments, provider, priceIds, catalog, webAppUrl: "https://app.test",
    hooks: { onSubscriptionPastDue: pastDue }, db: FAKE_TX, errors: testErrors, logger: silentLogger,
  });
  const webhook = provider
    ? new WebhookService({
        provider, eventRepo, runInTransaction: runInFakeTransaction, logger: silentLogger,
        handlers: {
          checkout_paid: (tx, e) => billing.onBundlePaid(tx, e),
          invoice_paid: (tx, e) => billing.onInvoicePaid(tx, e),
          subscription_changed: (tx, e) => billing.onSubscriptionChanged(tx, e),
          charge_refunded: (tx, e) => payments.onChargeRefunded(tx, e),
          dispute_funds: (tx, e) => payments.onDisputeFunds(tx, e),
        },
      })
    : null;

  let evt = 0;
  let inv = 0;
  const deliver = (body: Delivery) =>
    webhook!.handle("platform", FakeProvider.body({ id: `evt_${++evt}`, type: body.kind, ...body } as FakeWebhookBody), "valid");
  /** A paid invoice of a subscription (or of none), each with its own id unless the test names one. */
  const invoicePaid = (over: Partial<Extract<Delivery, { kind: "invoice_paid" }>> = {}) =>
    deliver({ kind: "invoice_paid", invoiceId: `in_${++inv}`, subscriptionId: "sub_1", customerId: null, amountPaid: 1900, currency: "eur", billingReason: "subscription_cycle", ...over });
  /** The subscription as Stripe would return it on retrieve. */
  const subscription = (over: Partial<SubscriptionFacts> = {}) => {
    const facts: SubscriptionFacts = { id: "sub_1", status: "active", priceId: "price_starter", currentPeriodEnd: MARCH, accountId: acme.id, customerId: null, ...over };
    provider!.subscriptions.set(facts.id, facts);
    return facts;
  };
  const session = (over: Partial<CheckoutSessionFacts> = {}): CheckoutSessionFacts => ({
    id: "cs_1", mode: "payment", paymentStatus: "paid", paymentIntentId: "pi_1", amountTotal: 1000, currency: "eur", metadata: { kind: "bundle", accountId: acme.id, bundleKey: "small" }, ...over,
  });
  const bundlePaid = (over: Partial<CheckoutSessionFacts> = {}) => deliver({ kind: "checkout_paid", type: "checkout.session.completed", session: session(over) });
  const account = async () => (await accountRepo.findById(FAKE_TX, acme.id))!;
  /** [reason, amount, remaining, expires] per lot, oldest first */
  const lots = () => credits.lots.map((l) => [l.reason, l.amount, l.remaining, l.expiresAt ?? null]);
  /** [lot reason, credits movement, delta] per row, oldest first */
  const creditRows = () => credits.moves.map((m) => [m.lot.reason, m.reason, m.delta]);
  /** [kind, amount, description] per row of real money, oldest first */
  const paymentRows = () => paymentRepo.rows.map((r) => [r.kind, r.amount, r.description]);
  const balance = () => credits.balance(ACME, new Date());

  return { accountRepo, paymentRepo, eventRepo, provider, credits, billing, webhook, acme, pastDue, deliver, invoicePaid, subscription, session, bundlePaid, account, lots, creditRows, paymentRows, balance };
}

describe("checkout", () => {
  it("creates the Customer once and sends the browser to the Stripe-hosted page", async () => {
    const s = await stack();
    const plan = await s.billing.checkout(AC, "organization", { planKey: "starter" });
    const bundle = await s.billing.checkout(AC, "organization", { bundleKey: "small" });
    expect(plan.url).toBe("https://checkout.stripe.test/plan/starter");
    expect(bundle.url).toBe("https://checkout.stripe.test/bundle/small");
    expect(s.provider!.calls.filter((c) => c.method === "ensureCustomer")).toHaveLength(1);
    expect((await s.account()).stripeCustomerId).toBe(`cus_${s.acme.id}`);
    expect(s.provider!.calls.find((c) => c.method === "checkoutForPlan")?.input).toMatchObject({
      priceId: "price_starter", accountId: s.acme.id, planKey: "starter",
      successUrl: "https://app.test/organizations/o-acme/billing?checkout=success",
      cancelUrl: "https://app.test/organizations/o-acme/billing?checkout=cancel",
    });
  });

  it("refuses a second plan while one is live, an unknown plan and an unknown bundle (UC13)", async () => {
    const s = await stack();
    await s.accountRepo.patchStripe(FAKE_TX, s.acme.id, { subscriptionStatus: "active", planKey: "starter" });
    await expect(s.billing.checkout(AC, "organization", { planKey: "pro" })).rejects.toThrow(/customer portal/);
    await expect(s.billing.checkout(AC, "organization", { planKey: "gold" })).rejects.toThrow(/unknown plan/);
    await expect(s.billing.checkout(AC, "organization", { bundleKey: "huge" })).rejects.toThrow(/unknown bundle/);
    expect(s.provider!.calls).toHaveLength(0);
  });

  it("is unavailable without a provider", async () => {
    const s = await stack({ provider: false });
    await expect(s.billing.checkout(AC, "organization", { bundleKey: "small" })).rejects.toThrow(/unavailable: payments are not configured/);
    await expect(s.billing.portal(AC, "organization")).rejects.toThrow(/unavailable/);
  });

  it("opens the portal only once a customer exists, returning to the owner's billing page (UC26)", async () => {
    const s = await stack();
    await expect(s.billing.portal(AC, "organization")).rejects.toThrow(/nothing to manage yet/);
    await s.billing.checkout(AC, "organization", { bundleKey: "small" });
    expect(await s.billing.portal(AC, "organization")).toEqual({ url: `https://portal.stripe.test/cus_${s.acme.id}` });
    expect(s.provider!.calls.at(-1)?.input).toMatchObject({ returnUrl: "https://app.test/organizations/o-acme/billing" });
  });
});

describe("bundles", () => {
  it("grants one top-up lot that never expires and records the money; a redelivery writes nothing (UC35, UC94)", async () => {
    const s = await stack();
    expect(await s.bundlePaid()).toEqual({ status: "processed", kind: "checkout_paid" });
    expect(s.lots()).toEqual([["top_up", 1000, 1000, null]]);
    expect(s.credits.moves.map((m) => [m.reason, m.delta, m.sourceEventId])).toEqual([["grant", 1000, "evt_1"]]);
    expect(s.paymentRows()).toEqual([["bundle", 1000, "Bought Small"]]);
    expect(s.paymentRepo.rows[0]).toMatchObject({ stripeRef: "cs_1", paymentIntentId: "pi_1", creditSourceRef: "cs_1", creditsGranted: 1000 });

    const replay = await s.webhook!.handle("platform", FakeProvider.body({ id: "evt_1", type: "checkout.session.completed", kind: "checkout_paid", session: s.session() }), "valid");
    expect(replay).toEqual({ status: "duplicate" });
    expect(s.balance()).toBe(1000);
    expect(s.paymentRepo.rows).toHaveLength(1);
  });

  it("grants and records once per payment even when a second event of the same session reports it paid (UC37)", async () => {
    const s = await stack();
    await s.bundlePaid({ paymentStatus: "unpaid" });
    await s.deliver({ kind: "checkout_paid", type: "checkout.session.async_payment_succeeded", session: s.session() });
    await s.deliver({ kind: "checkout_paid", type: "checkout.session.async_payment_succeeded", session: s.session() });
    expect(s.lots()).toEqual([["top_up", 1000, 1000, null]]);
    expect(s.paymentRepo.rows).toHaveLength(1);
  });

  it("ignores a plan's session", async () => {
    const s = await stack();
    await s.bundlePaid({ mode: "subscription", metadata: { kind: "plan", accountId: s.acme.id, planKey: "starter" } });
    expect(s.credits.lots).toHaveLength(0);
    expect(s.paymentRepo.rows).toHaveLength(0);
    expect(s.eventRepo.rows).toHaveLength(1); // claimed all the same: nothing to retry
  });
});

describe("subscriptions", () => {
  it("grants a plan lot expiring with the period, records the money and mirrors; the update that follows finds nothing to do (UC12)", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid({ billingReason: "subscription_create" });
    expect(await s.account()).toMatchObject({ planKey: "starter", subscriptionStatus: "active", stripeSubscriptionId: "sub_1", currentPeriodEnd: MARCH });
    expect(s.lots()).toEqual([["plan", 2000, 2000, MARCH]]);
    expect(s.paymentRows()).toEqual([["subscription", 1900, "Subscribed to Starter"]]);
    expect(s.paymentRepo.rows[0]).toMatchObject({ paymentIntentId: "pi_in_1", creditSourceRef: `sub_1:${MARCH.toISOString()}:starter`, creditsGranted: 2000 });
    expect(s.credits.priceLists.get("o-acme")).toBe("starter");

    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    expect(s.lots()).toHaveLength(1);
    expect(s.paymentRepo.rows).toHaveLength(1);
  });

  it("grants once in the other arrival order too, and the invoice still records the money (UC98)", async () => {
    const s = await stack();
    s.subscription();
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    await s.invoicePaid();
    expect(s.lots()).toEqual([["plan", 2000, 2000, MARCH]]);
    expect(s.paymentRows()).toEqual([["subscription", 1900, "Starter renewal"]]);
  });

  it("a renewal grants the next lot, is a second money row, and leaves the last lot to expire by its date (UC15)", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid({ billingReason: "subscription_create" });
    s.credits.spend(s.credits.lots[0].id, 5);

    s.subscription({ currentPeriodEnd: APRIL });
    await s.invoicePaid();
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    expect(s.lots()).toEqual([["plan", 2000, 1995, MARCH], ["plan", 2000, 2000, APRIL]]);
    expect((await s.account()).currentPeriodEnd).toEqual(APRIL);
    expect(s.paymentRows().map((r) => r[2])).toEqual(["Subscribed to Starter", "Starter renewal"]);
  });

  it("a failed renewal grants nothing and tells the app once; the lot lands when the invoice is finally paid (UC21, UC22)", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid();

    s.subscription({ status: "past_due", currentPeriodEnd: APRIL });
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    expect(s.lots()).toHaveLength(1);
    expect(await s.account()).toMatchObject({ subscriptionStatus: "past_due", currentPeriodEnd: MARCH });
    expect(s.pastDue).toHaveBeenCalledTimes(1);
    expect(s.pastDue).toHaveBeenCalledWith({ owner: ACME });

    s.subscription({ status: "active", currentPeriodEnd: APRIL });
    await s.invoicePaid();
    expect(s.lots()).toEqual([["plan", 2000, 2000, MARCH], ["plan", 2000, 2000, APRIL]]);
    expect(await s.account()).toMatchObject({ subscriptionStatus: "active", currentPeriodEnd: APRIL });
  });

  it("a plan change ends the current lot now, grants the new amount once and moves the price list (UC17, UC99)", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid();

    s.subscription({ priceId: "price_pro" });
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1" });
    await s.invoicePaid({ billingReason: "subscription_update", amountPaid: 2000 });
    expect(s.lots()).toEqual([["plan", 2000, 0, MARCH], ["plan", 6000, 6000, MARCH]]);
    expect(s.creditRows()).toEqual([["plan", "grant", 2000], ["plan", "expire", -2000], ["plan", "grant", 6000]]);
    expect((await s.account()).planKey).toBe("pro");
    expect(s.credits.priceLists.get("o-acme")).toBe("pro");
    expect(s.paymentRows().at(-1)).toEqual(["subscription", 2000, "Changed to Pro"]);
  });

  it("a cancel ends the plan lot, clears the plan and the price list (UC19, UC139)", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid();
    await s.credits.grant(FAKE_TX, { owner: ACME, reason: "top_up", amount: 1000 });
    s.subscription({ status: "canceled" });
    await s.deliver({ kind: "subscription_changed", subscriptionId: "sub_1", type: "customer.subscription.deleted" });
    expect(s.creditRows().filter((r) => r[1] === "expire")).toEqual([["plan", "expire", -2000]]);
    expect(await s.account()).toMatchObject({ planKey: null, subscriptionStatus: "canceled", currentPeriodEnd: null });
    expect(s.balance()).toBe(1000);
    expect(s.credits.priceLists.get("o-acme")).toBeNull();
  });

  it("a price that is not a catalog plan mirrors the status, grants nothing, and still records the money", async () => {
    const s = await stack();
    s.subscription({ priceId: "price_from_the_dashboard" });
    await s.invoicePaid();
    expect(s.credits.lots).toHaveLength(0);
    expect(await s.account()).toMatchObject({ subscriptionStatus: "active", planKey: null, stripeSubscriptionId: "sub_1" });
    expect(s.paymentRows()).toEqual([["subscription", 1900, "Subscription invoice"]]);
    expect(s.paymentRepo.rows[0]).toMatchObject({ creditSourceRef: null, creditsGranted: 0 });
  });

  it("resolves the account by customer when the subscription carries no account id", async () => {
    const s = await stack();
    await s.accountRepo.patchStripe(FAKE_TX, s.acme.id, { stripeCustomerId: "cus_x" });
    s.subscription({ accountId: null, customerId: "cus_x" });
    await s.invoicePaid();
    expect(s.balance()).toBe(2000);
  });

  it("records no money row for an invoice of nothing (a trial, a full credit)", async () => {
    const s = await stack();
    s.subscription({ status: "trialing" });
    await s.invoicePaid({ amountPaid: 0 });
    expect(s.lots()).toHaveLength(1); // a trial's period still grants
    expect(s.paymentRepo.rows).toHaveLength(0);
  });

  it("records a one-off invoice by its customer, with no plan and no credits; an unknown customer writes nothing", async () => {
    const s = await stack();
    await s.accountRepo.patchStripe(FAKE_TX, s.acme.id, { stripeCustomerId: "cus_x" });
    await s.invoicePaid({ subscriptionId: null, customerId: "cus_x", billingReason: "manual", amountPaid: 7500 });
    expect(s.paymentRows()).toEqual([["invoice", 7500, "Invoice"]]);
    await s.invoicePaid({ subscriptionId: null, customerId: "cus_ghost", amountPaid: 100 });
    expect(s.paymentRepo.rows).toHaveLength(1);
    expect(s.credits.lots).toHaveLength(0);
  });
});

describe("money going back", () => {
  it("a full refund of a bundle writes the negative row and takes the credits back", async () => {
    const s = await stack();
    await s.bundlePaid();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 1000 });
    expect(s.paymentRows()).toEqual([["bundle", 1000, "Bought Small"], ["refund", -1000, "Refund: Bought Small"]]);
    expect(s.creditRows().at(-1)).toEqual(["top_up", "take_back", -1000]);
    expect(s.balance()).toBe(0);
  });

  it("takes back only what is left: credits already spent stay spent, never below zero", async () => {
    const s = await stack();
    await s.bundlePaid();
    s.credits.spend(s.credits.lots[0].id, 700);
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 1000 });
    expect(s.creditRows().at(-1)).toEqual(["top_up", "take_back", -300]);
    expect(s.credits.lots[0].remaining).toBe(0);
  });

  it("a partial refund takes at most its share, and a second one its own", async () => {
    const s = await stack();
    await s.bundlePaid();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 400 });
    expect(s.credits.lots[0].remaining).toBe(600);
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 700 });
    expect(s.paymentRows().slice(1).map((r) => r[1])).toEqual([-400, -300]);
    expect(s.credits.lots[0].remaining).toBe(300);
  });

  it("an older running total arriving late writes nothing", async () => {
    const s = await stack();
    await s.bundlePaid();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 700 });
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 400 });
    expect(s.paymentRows().slice(1).map((r) => r[1])).toEqual([-700]);
    expect(s.credits.lots[0].remaining).toBe(300);
  });

  it("a redelivered refund writes nothing", async () => {
    const s = await stack();
    await s.bundlePaid();
    await s.deliver({ id: "evt_refund", kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 400 });
    expect(await s.deliver({ id: "evt_refund", kind: "charge_refunded", paymentIntentId: "pi_1", amountRefunded: 400 })).toEqual({ status: "duplicate" });
    expect(s.paymentRepo.rows).toHaveLength(2);
    expect(s.credits.lots[0].remaining).toBe(600);
  });

  it("refunding a subscription invoice takes back that period's plan credits", async () => {
    const s = await stack();
    s.subscription();
    await s.invoicePaid({ invoiceId: "in_9" });
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_in_9", amountRefunded: 950 });
    expect(s.credits.lots[0].remaining).toBe(1000);
  });

  it("a refund of a charge never on the ledger writes nothing", async () => {
    const s = await stack();
    await s.deliver({ kind: "charge_refunded", paymentIntentId: "pi_unknown", amountRefunded: 100 });
    expect(s.paymentRepo.rows).toHaveLength(0);
  });

  it("a chargeback writes the negative row and takes the credits back; a dispute won gives the money back, not the credits", async () => {
    const s = await stack();
    await s.bundlePaid();
    await s.deliver({ kind: "dispute_funds", type: "charge.dispute.funds_withdrawn", disputeId: "dp_1", paymentIntentId: "pi_1", amount: 1000, direction: "withdrawn" });
    expect(s.paymentRows().at(-1)).toEqual(["chargeback", -1000, "Chargeback: Bought Small"]);
    expect(s.credits.lots[0].remaining).toBe(0);

    await s.deliver({ kind: "dispute_funds", type: "charge.dispute.funds_reinstated", disputeId: "dp_1", paymentIntentId: "pi_1", amount: 1000, direction: "reinstated" });
    expect(s.paymentRows().at(-1)).toEqual(["chargeback_reversal", 1000, "Chargeback reversed: Bought Small"]);
    expect(s.credits.lots[0].remaining).toBe(0);
  });
});

describe("webhook", () => {
  it("refuses a signature that does not verify before claiming anything (UC96)", async () => {
    const s = await stack();
    await expect(s.webhook!.handle("platform", "{}", "forged")).rejects.toBeInstanceOf(ProviderSignatureError);
    expect(s.eventRepo.rows).toHaveLength(0);
  });

  it("answers an unsubscribed event without a claim, and claims a kind that has no handler", async () => {
    const s = await stack();
    expect(await s.deliver({ kind: "ignored", type: "customer.created" })).toEqual({ status: "ignored" });
    expect(s.eventRepo.rows).toHaveLength(0);
    expect(await s.deliver({ kind: "account_updated", chargesEnabled: true })).toEqual({ status: "processed", kind: "account_updated" });
    expect(s.eventRepo.rows).toHaveLength(1);
  });
});
