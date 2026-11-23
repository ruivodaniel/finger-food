/**
 * A scripted payment provider — records every call, answers with URLs and
 * ids, and lets a test hand the webhook the events it wants. The signature
 * check is a convention: the signature "valid" verifies, anything else does
 * not. Subscriptions are whatever the test told the fake they are.
 */

import type {
  PaymentProvider,
  ProviderEvent,
  SubscriptionFacts,
  WebhookEndpoint,
} from "../stripe/provider";
import { ProviderSignatureError } from "../stripe/provider";

/** Omit that distributes over a union, so each event kind keeps its own fields. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A webhook body as a test posts it: the port's event, the endpoint's own field optional. */
export type FakeWebhookBody = DistributiveOmit<ProviderEvent, "connectedAccountId"> & { connectedAccountId?: string | null };

export class FakeProvider implements PaymentProvider {
  calls: { method: string; input: unknown }[] = [];
  subscriptions = new Map<string, SubscriptionFacts>();
  accounts = new Map<string, { chargesEnabled: boolean }>();
  private seq = 0;

  private record<T>(method: string, input: unknown, out: T): T {
    this.calls.push({ method, input });
    return out;
  }

  async ensureCustomer(input: { accountId: string }) {
    return this.record("ensureCustomer", input, { customerId: `cus_${input.accountId}` });
  }
  async checkoutForPlan(input: Parameters<PaymentProvider["checkoutForPlan"]>[0]) {
    return this.record("checkoutForPlan", input, { url: `https://checkout.stripe.test/plan/${input.planKey}` });
  }
  async checkoutForBundle(input: Parameters<PaymentProvider["checkoutForBundle"]>[0]) {
    return this.record("checkoutForBundle", input, { url: `https://checkout.stripe.test/bundle/${input.bundleKey}` });
  }
  async portalSession(input: { customerId: string; returnUrl: string }) {
    return this.record("portalSession", input, { url: `https://portal.stripe.test/${input.customerId}` });
  }
  async retrieveSubscription(subscriptionId: string) {
    const facts = this.subscriptions.get(subscriptionId);
    if (!facts) throw new Error(`fake: no subscription ${subscriptionId}`);
    return this.record("retrieveSubscription", { subscriptionId }, facts);
  }
  async invoicePaymentIntent(invoiceId: string): Promise<string | null> {
    return this.record("invoicePaymentIntent", { invoiceId }, `pi_${invoiceId}`);
  }
  parseWebhook(rawBody: string, signature: string, endpoint: WebhookEndpoint): ProviderEvent {
    this.calls.push({ method: "parseWebhook", input: { endpoint, signature } });
    if (signature !== "valid") throw new ProviderSignatureError();
    return JSON.parse(rawBody) as ProviderEvent;
  }

  async createSellerAccount(input: { accountId: string; country: string }) {
    const id = `acct_${input.accountId}`;
    this.accounts.set(id, { chargesEnabled: false });
    return this.record("createSellerAccount", input, { connectedAccountId: id });
  }
  async onboardingLink(input: { connectedAccountId: string; returnUrl: string; refreshUrl: string }) {
    return this.record("onboardingLink", input, { url: `https://connect.stripe.test/onboard/${input.connectedAccountId}` });
  }
  async dashboardLink(input: { connectedAccountId: string }) {
    return this.record("dashboardLink", input, { url: `https://connect.stripe.test/dashboard/${input.connectedAccountId}` });
  }
  async retrieveSellerAccount(connectedAccountId: string) {
    return this.record("retrieveSellerAccount", { connectedAccountId }, this.accounts.get(connectedAccountId) ?? { chargesEnabled: false });
  }
  async checkoutForPurchase(input: Parameters<PaymentProvider["checkoutForPurchase"]>[0]) {
    return this.record("checkoutForPurchase", input, { url: `https://checkout.stripe.test/purchase/${++this.seq}` });
  }

  /** A webhook body the fake's parseWebhook accepts, as a test would post it. */
  static body(event: FakeWebhookBody): string {
    return JSON.stringify({ connectedAccountId: null, ...event });
  }
}
