/**
 * The payment provider PORT — the only shape the services and the webhook
 * handlers know. `stripe-adapter.ts` implements it with the SDK; the fake in
 * `testing/` implements it with a script. No Stripe type crosses this file.
 *
 * Every object the provider creates for us carries `metadata.accountId`, so
 * an event always resolves back to OUR account by OUR id.
 */

export type CheckoutKind = "plan" | "bundle" | "purchase";

export interface CheckoutSessionFacts {
  id: string;
  mode: "payment" | "subscription" | "setup";
  /** paid | unpaid | no_payment_required */
  paymentStatus: string;
  paymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
  metadata: Record<string, string>;
}

export interface SubscriptionFacts {
  id: string;
  /** Stripe's status, verbatim */
  status: string;
  /** the first item's price id — the catalog key is derived from it */
  priceId: string | null;
  currentPeriodEnd: Date | null;
  /** our account id, from the subscription's metadata */
  accountId: string | null;
  customerId: string | null;
}

export type ProviderEvent = { id: string; type: string; connectedAccountId: string | null } & (
  | { kind: "checkout_paid"; session: CheckoutSessionFacts }
  | {
      kind: "invoice_paid";
      invoiceId: string;
      subscriptionId: string | null;
      customerId: string | null;
      amountPaid: number;
      currency: string;
      /** Stripe's reason, verbatim: subscription_create, subscription_cycle, subscription_update, manual, … */
      billingReason: string | null;
    }
  | { kind: "subscription_changed"; subscriptionId: string }
  /** `amountRefunded` is the running total on the charge, not this refund's amount */
  | { kind: "charge_refunded"; paymentIntentId: string | null; amountRefunded: number }
  | { kind: "dispute_funds"; disputeId: string; paymentIntentId: string | null; amount: number; direction: "withdrawn" | "reinstated" }
  | { kind: "account_updated"; chargesEnabled: boolean }
  | { kind: "ignored" }
);

export type ProviderEventKind = ProviderEvent["kind"];

/** Which endpoint received the body — the platform's own events, or events on connected accounts. */
export type WebhookEndpoint = "platform" | "connect";

/** The signature did not verify (or the body is not an event). The router answers 400. */
export class ProviderSignatureError extends Error {
  constructor(message = "webhook signature did not verify") {
    super(message);
    this.name = "ProviderSignatureError";
  }
}

export interface ReturnUrls {
  successUrl: string;
  cancelUrl: string;
}

export interface PaymentProvider {
  ensureCustomer(input: { accountId: string }): Promise<{ customerId: string }>;
  checkoutForPlan(input: { customerId: string; priceId: string; accountId: string; planKey: string } & ReturnUrls): Promise<{ url: string }>;
  checkoutForBundle(input: { customerId: string; priceId: string; accountId: string; bundleKey: string } & ReturnUrls): Promise<{ url: string }>;
  portalSession(input: { customerId: string; returnUrl: string }): Promise<{ url: string }>;
  retrieveSubscription(subscriptionId: string): Promise<SubscriptionFacts>;
  /** The payment intent that paid an invoice — what a later refund names. */
  invoicePaymentIntent(invoiceId: string): Promise<string | null>;
  /** Throws ProviderSignatureError when the body is not a verified event of this endpoint. */
  parseWebhook(rawBody: string, signature: string, endpoint: WebhookEndpoint): ProviderEvent;

  // ── the vendor side (marketplace) ──
  createSellerAccount(input: { accountId: string; country: string }): Promise<{ connectedAccountId: string }>;
  onboardingLink(input: { connectedAccountId: string; returnUrl: string; refreshUrl: string }): Promise<{ url: string }>;
  dashboardLink(input: { connectedAccountId: string }): Promise<{ url: string }>;
  retrieveSellerAccount(connectedAccountId: string): Promise<{ chargesEnabled: boolean }>;
  /** A direct charge on the vendor's connected account, priced inline, with the platform fee. */
  checkoutForPurchase(
    input: {
      connectedAccountId: string;
      accountId: string;
      /** the member who pressed buy — named on the purchase's ledger rows */
      buyerUserId: string;
      productId: string;
      name: string;
      description: string | null;
      unitAmount: number;
      currency: string;
      quantity: number;
      feeAmount: number;
    } & ReturnUrls,
  ): Promise<{ url: string }>;
}
