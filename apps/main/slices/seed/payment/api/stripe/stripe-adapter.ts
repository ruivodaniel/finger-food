/**
 * The Stripe adapter — the ONE file in the repository that imports the
 * `stripe` SDK. It implements the provider port with the SDK and translates
 * Stripe's objects into the port's facts; no Stripe type leaves this file.
 *
 * The API version is pinned here because this is the only place that knows
 * where a field lives (basil moved `current_period_end` onto the subscription
 * item and the invoice's subscription under `parent`).
 */

import Stripe from "stripe";
import type { CheckoutSessionFacts, PaymentProvider, ProviderEvent, SubscriptionFacts, WebhookEndpoint } from "./provider";
import { ProviderSignatureError } from "./provider";

const API_VERSION = "2025-08-27.basil";
/** Express dashboard + Stripe liable for losses is a public preview of Accounts v2 (Managed Risk). */
const ACCOUNTS_PREVIEW_VERSION = "2026-09-30.preview";

export interface StripeProviderConfig {
  secretKey: string;
  /** the signing secret of the platform endpoint (`POST /api/webhooks/stripe`) */
  webhookSecret: string;
  /** the signing secret of the connect endpoint (`…/connect`); without it that endpoint verifies nothing */
  connectWebhookSecret?: string;
}

/** Stripe expands references on request; we only ever want the id. */
const idOf = (ref: string | { id: string } | null | undefined): string | null =>
  ref == null ? null : typeof ref === "string" ? ref : ref.id;

const urlOf = (hosted: { url: string | null }, what: string): { url: string } => {
  if (!hosted.url) throw new Error(`stripe returned no URL for the ${what}`);
  return { url: hosted.url };
};

export function createStripeProvider(config: StripeProviderConfig): PaymentProvider {
  const stripe = new Stripe(config.secretKey, { apiVersion: API_VERSION });
  const secrets: Record<WebhookEndpoint, string | undefined> = {
    platform: config.webhookSecret,
    connect: config.connectWebhookSecret,
  };

  const sessionFacts = (s: Stripe.Checkout.Session): CheckoutSessionFacts => ({
    id: s.id,
    mode: s.mode,
    paymentStatus: s.payment_status,
    paymentIntentId: idOf(s.payment_intent),
    amountTotal: s.amount_total,
    currency: s.currency,
    metadata: s.metadata ?? {},
  });

  const subscriptionFacts = (s: Stripe.Subscription): SubscriptionFacts => {
    const item = s.items.data[0];
    return {
      id: s.id,
      status: s.status,
      priceId: item?.price.id ?? null,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      accountId: s.metadata.accountId ?? null,
      customerId: idOf(s.customer),
    };
  };

  /** Stripe's event → the port's event. Anything we did not subscribe to is `ignored`. */
  const translate = (event: Stripe.Event): ProviderEvent => {
    const base = { id: event.id, type: event.type, connectedAccountId: event.account ?? null };
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        return { ...base, kind: "checkout_paid", session: sessionFacts(event.data.object) };
      case "invoice.paid": {
        const invoice = event.data.object;
        return {
          ...base,
          kind: "invoice_paid",
          invoiceId: invoice.id as string,
          subscriptionId: idOf(invoice.parent?.subscription_details?.subscription),
          customerId: idOf(invoice.customer),
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          billingReason: invoice.billing_reason,
        };
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return { ...base, kind: "subscription_changed", subscriptionId: event.data.object.id };
      case "charge.refunded":
        return {
          ...base,
          kind: "charge_refunded",
          paymentIntentId: idOf(event.data.object.payment_intent),
          amountRefunded: event.data.object.amount_refunded,
        };
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.funds_reinstated":
        return {
          ...base,
          kind: "dispute_funds",
          disputeId: event.data.object.id,
          paymentIntentId: idOf(event.data.object.payment_intent),
          amount: event.data.object.amount,
          direction: event.type === "charge.dispute.funds_withdrawn" ? "withdrawn" : "reinstated",
        };
      case "account.updated":
        return { ...base, kind: "account_updated", chargesEnabled: event.data.object.charges_enabled };
      default:
        return { ...base, kind: "ignored" };
    }
  };

  return {
    // ── the buyer's side ──────────────────────────────────────────────────
    async ensureCustomer({ accountId }) {
      // the idempotency key makes a retried request return the same Customer
      const customer = await stripe.customers.create({ metadata: { accountId } }, { idempotencyKey: `customer:${accountId}` });
      return { customerId: customer.id };
    },

    async checkoutForPlan({ customerId, priceId, accountId, planKey, successUrl, cancelUrl }) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { kind: "plan", accountId, planKey },
        subscription_data: { metadata: { accountId } },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return urlOf(session, "plan checkout");
    },

    async checkoutForBundle({ customerId, priceId, accountId, bundleKey, successUrl, cancelUrl }) {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { kind: "bundle", accountId, bundleKey },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      return urlOf(session, "bundle checkout");
    },

    async portalSession({ customerId, returnUrl }) {
      const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
      return { url: session.url };
    },

    async retrieveSubscription(subscriptionId) {
      return subscriptionFacts(await stripe.subscriptions.retrieve(subscriptionId));
    },

    async invoicePaymentIntent(invoiceId) {
      // basil moved the invoice's payment intent into its `payments` list, which is only returned on request
      const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ["payments"] });
      return idOf(invoice.payments?.data[0]?.payment.payment_intent);
    },

    parseWebhook(rawBody, signature, endpoint) {
      const secret = secrets[endpoint];
      if (!secret) throw new ProviderSignatureError(`the ${endpoint} webhook endpoint is not configured`);
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      } catch (error) {
        throw new ProviderSignatureError(error instanceof Error ? error.message : undefined);
      }
      return translate(event);
    },

    // ── the vendor's side (marketplace) ───────────────────────────────────
    async createSellerAccount({ accountId, country }) {
      // P13 with Managed Risk (ruled 2026-10-13): direct charges on the vendor's
      // account; Stripe bills its fees to the vendor, screens vendors and
      // absorbs the losses it cannot recover; the vendor works from an Express
      // dashboard. Only Accounts v2 offers Express with Stripe liable, and only
      // under the preview version, so this one call goes through `rawRequest`.
      // Every other call (links, retrieve, charges) takes the v2 account's id
      // on the v1 endpoints. One idempotency key per vendor: under Accounts v2
      // a repeat with the same key retries a failed attempt (for 30 days) and
      // returns the account an earlier success made, so a retry never opens a
      // second account. `seller:v2:` keeps it apart from the old v1 key.
      const response = await stripe.rawRequest(
        "POST",
        "/v2/core/accounts",
        {
          dashboard: "express",
          identity: { country },
          configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
          defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
          metadata: { accountId },
        },
        { apiVersion: ACCOUNTS_PREVIEW_VERSION, idempotencyKey: `seller:v2:${accountId}` },
      );
      const id = (response as { id?: unknown }).id;
      if (typeof id !== "string") throw new Error("stripe returned no id for the vendor account");
      return { connectedAccountId: id };
    },

    async onboardingLink({ connectedAccountId, returnUrl, refreshUrl }) {
      const link = await stripe.accountLinks.create({
        account: connectedAccountId,
        type: "account_onboarding",
        return_url: returnUrl,
        refresh_url: refreshUrl,
      });
      return { url: link.url };
    },

    async dashboardLink({ connectedAccountId }) {
      const link = await stripe.accounts.createLoginLink(connectedAccountId);
      return { url: link.url };
    },

    async retrieveSellerAccount(connectedAccountId) {
      const account = await stripe.accounts.retrieve(connectedAccountId);
      return { chargesEnabled: account.charges_enabled };
    },

    async checkoutForPurchase(input) {
      const session = await stripe.checkout.sessions.create(
        {
          mode: "payment",
          line_items: [
            {
              quantity: input.quantity,
              price_data: {
                currency: input.currency,
                unit_amount: input.unitAmount,
                product_data: { name: input.name, ...(input.description ? { description: input.description } : {}) },
              },
            },
          ],
          // the platform's share of a direct charge; the rest settles on the vendor's account
          payment_intent_data: { application_fee_amount: input.feeAmount },
          metadata: {
            kind: "purchase",
            accountId: input.accountId,
            buyerUserId: input.buyerUserId,
            productId: input.productId,
            quantity: String(input.quantity),
            feeAmount: String(input.feeAmount),
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        },
        // the session is created ON the vendor's account: a direct charge
        { stripeAccount: input.connectedAccountId },
      );
      return urlOf(session, "purchase checkout");
    },
  };
}
