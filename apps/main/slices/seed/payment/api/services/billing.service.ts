/**
 * Billing service — the plan and the bundles, on the buyer's side of Stripe.
 *
 * Checkout: the caller proves custody of the owner's account (the account
 * service's verdict plus gated read), the Customer is created once, and the
 * browser is sent to the Stripe-hosted page. Everything after that arrives
 * as a payment event, and the subscription handlers never trust the event's
 * payload: they retrieve the subscription and set the mirror from it, so the
 * arrival order of `invoice.paid` and `customer.subscription.*` cannot leave
 * the mirror stale.
 *
 * When does a paid period's lot land? When the subscription is in good
 * standing AND either the plan changed or the period end moved past the one
 * we last granted for. The first of the two events grants; the second finds
 * nothing to do, and the lot's source key (subscription, period end, plan)
 * makes a concurrent second grant impossible at the database. A renewal
 * whose payment failed moves Stripe's period end but not ours
 * (`current_period_end` mirrors the last PAID period), so the lot arrives
 * when the invoice is finally paid.
 *
 * A plan lot expires with its period; the previous period's lot is left to
 * expire by its own date. A changed plan ends the current lot now and grants
 * the new plan's amount; an ended subscription ends it and clears the plan.
 * The price list the owner pays by follows the plan, in the same transaction.
 *
 * Money on the record: every paid invoice and bundle is a row of the payment
 * ledger, written in the transaction that grants its credits.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { PaymentCatalog, PaymentPlan } from "../../shared/catalog";
import { paymentPaths, priceEnvName } from "../../shared";
import type { PaymentHooks } from "../../shared/hooks";
import type { BillingScope, CheckoutUrl, PaymentOwner } from "../../shared/types";
import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { CreditsPort } from "../shared/credits-port";
import type { Executor } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { PaymentProvider, ProviderEvent, SubscriptionFacts } from "../stripe/provider";
import type { PaymentAccountService } from "./payment-account.service";
import type { PaymentLedgerService } from "./payment-ledger.service";

/** The one lot per subscription, period and plan: a return to the same plan within a period grants nothing again. */
const planSourceRef = (facts: SubscriptionFacts, plan: PaymentPlan) => `${facts.id}:${facts.currentPeriodEnd?.toISOString() ?? "open"}:${plan.key}`;

/** The line a paid subscription invoice shows on the payment ledger. */
function invoiceDescription(reason: string | null, plan: PaymentPlan | null): string {
  if (!plan) return "Subscription invoice";
  if (reason === "subscription_create") return `Subscribed to ${plan.name}`;
  if (reason === "subscription_cycle") return `${plan.name} renewal`;
  if (reason === "subscription_update") return `Changed to ${plan.name}`;
  return `${plan.name} invoice`;
}

/** Stripe statuses under which the owner still holds the plan (a new plan cannot be bought — the portal changes it). */
const LIVE_STATUSES = new Set(["trialing", "active", "past_due", "unpaid", "paused"]);
/** Statuses under which a period's credits are granted. */
const PAID_STATUSES = new Set(["trialing", "active"]);
/** The subscription is over: the plan lot ends, the plan key clears. */
const ENDED_STATUSES = new Set(["canceled", "incomplete_expired"]);

export interface BillingServiceDeps {
  accountRepo: PaymentAccountRepository;
  accounts: Pick<PaymentAccountService, "requireManageable">;
  credits: Pick<CreditsPort, "currency" | "grant" | "endLots" | "setPriceList">;
  payments: Pick<PaymentLedgerService, "record">;
  provider: PaymentProvider | null;
  /** catalog key → Stripe price id; the mount checked every plan and bundle has one */
  priceIds: Record<string, string>;
  catalog: Pick<PaymentCatalog, "plans" | "bundles">;
  webAppUrl: string;
  hooks: Pick<PaymentHooks, "onSubscriptionPastDue">;
  /** single statements outside the webhook's transaction */
  db: Executor;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export class BillingService {
  private readonly deps: BillingServiceDeps;

  constructor(deps: BillingServiceDeps) {
    this.deps = deps;
  }

  private get provider(): PaymentProvider {
    if (!this.deps.provider) throw this.deps.errors.unavailable("payments are not configured");
    return this.deps.provider;
  }

  /** Where a Stripe-hosted page sends the browser back: the owner's billing page. */
  private billingPage(owner: PaymentOwner): string {
    const path = owner.organizationId != null ? paymentPaths.organizationBilling(owner.organizationId) : paymentPaths.personalBilling;
    return `${this.deps.webAppUrl}${path}`;
  }

  private planFor(key: string | null) {
    return key ? (this.deps.catalog.plans.find((p) => p.key === key) ?? null) : null;
  }

  private keyForPrice(priceId: string | null): string | null {
    if (!priceId) return null;
    return Object.entries(this.deps.priceIds).find(([, id]) => id === priceId)?.[0] ?? null;
  }

  private priceFor(key: string): string {
    const priceId = this.deps.priceIds[key];
    if (!priceId) throw this.deps.errors.internalError(`no Stripe price for "${key}" — set ${priceEnvName(key)}`);
    return priceId;
  }

  // ── the buyer's side ──────────────────────────────────────────────────────

  /** The Customer once, remembered on the account. */
  private async ensureCustomer(account: PaymentAccountSelect): Promise<string> {
    if (account.stripeCustomerId) return account.stripeCustomerId;
    const { customerId } = await this.provider.ensureCustomer({ accountId: account.id });
    await this.deps.accountRepo.patchStripe(this.deps.db, account.id, { stripeCustomerId: customerId });
    return customerId;
  }

  async checkout(ac: ScopedAcRequestContext, scope: BillingScope, input: { planKey: string } | { bundleKey: string }): Promise<CheckoutUrl> {
    const provider = this.provider;
    const { account, owner } = await this.deps.accounts.requireManageable(ac, scope);
    const page = this.billingPage(owner);
    const urls = { successUrl: `${page}?checkout=success`, cancelUrl: `${page}?checkout=cancel` };

    if ("planKey" in input) {
      if (!this.planFor(input.planKey)) throw this.deps.errors.badRequest(`unknown plan "${input.planKey}"`);
      if (account.subscriptionStatus && LIVE_STATUSES.has(account.subscriptionStatus))
        throw this.deps.errors.badRequest("a plan is active — change it from the customer portal");
      const customerId = await this.ensureCustomer(account);
      return provider.checkoutForPlan({ customerId, priceId: this.priceFor(input.planKey), accountId: account.id, planKey: input.planKey, ...urls });
    }

    if (!this.deps.catalog.bundles.some((b) => b.key === input.bundleKey)) throw this.deps.errors.badRequest(`unknown bundle "${input.bundleKey}"`);
    const customerId = await this.ensureCustomer(account);
    return provider.checkoutForBundle({ customerId, priceId: this.priceFor(input.bundleKey), accountId: account.id, bundleKey: input.bundleKey, ...urls });
  }

  async portal(ac: ScopedAcRequestContext, scope: BillingScope): Promise<CheckoutUrl> {
    const provider = this.provider;
    const { account, owner } = await this.deps.accounts.requireManageable(ac, scope);
    if (!account.stripeCustomerId) throw this.deps.errors.badRequest("nothing to manage yet — choose a plan or buy a bundle first");
    return provider.portalSession({ customerId: account.stripeCustomerId, returnUrl: this.billingPage(owner) });
  }

  // ── the payment events (inside the webhook's transaction) ─────────────────

  private ownerOf(account: PaymentAccountSelect): PaymentOwner {
    return account.organizationId != null ? { organizationId: account.organizationId } : { userId: account.userId as string };
  }

  /** The subscription's account, locked: two events of one subscription apply one after the other. */
  private async accountFor(tx: Executor, facts: SubscriptionFacts): Promise<PaymentAccountSelect | null> {
    const found = facts.accountId
      ? await this.deps.accountRepo.findById(tx, facts.accountId)
      : facts.customerId
        ? await this.deps.accountRepo.findByStripeCustomer(tx, facts.customerId)
        : null;
    return found ? this.deps.accountRepo.lockForUpdate(tx, found.id) : null;
  }

  /** Retrieve-then-set: the subscription's truth from Stripe, the mirror and the plan lot from it. The account, when it is ours. */
  private async syncSubscription(tx: Executor, facts: SubscriptionFacts, eventId: string): Promise<PaymentAccountSelect | null> {
    const account = await this.accountFor(tx, facts);
    if (!account) {
      this.deps.logger.warn("subscription event for an unknown account", { subscriptionId: facts.id, eventId });
      return null;
    }
    const owner = this.ownerOf(account);

    if (ENDED_STATUSES.has(facts.status)) {
      await this.deps.credits.endLots(tx, owner, "plan", { sourceEventId: eventId });
      await this.deps.credits.setPriceList(tx, owner, null);
      await this.deps.accountRepo.patchStripe(tx, account.id, {
        stripeSubscriptionId: facts.id, subscriptionStatus: facts.status, planKey: null, currentPeriodEnd: null,
      });
      return account;
    }

    const planKey = this.keyForPrice(facts.priceId);
    const plan = this.planFor(planKey);
    if (!plan) this.deps.logger.warn("subscription price is not a catalog plan", { priceId: facts.priceId, eventId });

    const periodMoved = facts.currentPeriodEnd?.getTime() !== account.currentPeriodEnd?.getTime();
    const paidPeriod = plan != null && PAID_STATUSES.has(facts.status) && (planKey !== account.planKey || periodMoved);
    const fellPastDue = facts.status === "past_due" && account.subscriptionStatus !== "past_due";

    if (planKey !== account.planKey) await this.deps.credits.setPriceList(tx, owner, plan ? planKey : null);
    if (paidPeriod) {
      if (planKey !== account.planKey) await this.deps.credits.endLots(tx, owner, "plan", { sourceEventId: eventId });
      await this.deps.credits.grant(tx, { owner, reason: "plan", amount: plan.credits, expiresAt: facts.currentPeriodEnd, sourceRef: planSourceRef(facts, plan), sourceEventId: eventId });
    }
    await this.deps.accountRepo.patchStripe(tx, account.id, {
      stripeSubscriptionId: facts.id,
      subscriptionStatus: facts.status,
      planKey,
      ...(paidPeriod ? { currentPeriodEnd: facts.currentPeriodEnd } : {}),
    });
    if (fellPastDue) await this.deps.hooks.onSubscriptionPastDue?.({ owner });
    return account;
  }

  /** A paid invoice: the subscription's mirror and lot when it has one, and the money on the record. Nothing paid, nothing to record. */
  async onInvoicePaid(tx: Executor, event: Extract<ProviderEvent, { kind: "invoice_paid" }>): Promise<void> {
    if (!event.subscriptionId) {
      if (event.amountPaid > 0) await this.recordOneOffInvoice(tx, event);
      return;
    }
    const facts = await this.provider.retrieveSubscription(event.subscriptionId);
    const account = await this.syncSubscription(tx, facts, event.id);
    if (!account || event.amountPaid <= 0) return;
    const plan = this.planFor(this.keyForPrice(facts.priceId));
    await this.deps.payments.record(tx, {
      accountId: account.id, kind: "subscription", amount: event.amountPaid, currency: event.currency,
      description: invoiceDescription(event.billingReason, plan), stripeRef: event.invoiceId,
      paymentIntentId: await this.provider.invoicePaymentIntent(event.invoiceId),
      creditSourceRef: plan ? planSourceRef(facts, plan) : null, creditsGranted: plan?.credits ?? 0,
    });
  }

  /** An invoice raised by hand in the dashboard: money on the record, no plan, no credits. */
  private async recordOneOffInvoice(tx: Executor, event: Extract<ProviderEvent, { kind: "invoice_paid" }>): Promise<void> {
    const account = event.customerId ? await this.deps.accountRepo.findByStripeCustomer(tx, event.customerId) : null;
    if (!account) {
      this.deps.logger.warn("paid invoice for an unknown customer", { invoiceId: event.invoiceId, eventId: event.id });
      return;
    }
    await this.deps.payments.record(tx, {
      accountId: account.id, kind: "invoice", amount: event.amountPaid, currency: event.currency, description: "Invoice", stripeRef: event.invoiceId,
      paymentIntentId: await this.provider.invoicePaymentIntent(event.invoiceId),
    });
  }

  async onSubscriptionChanged(tx: Executor, event: Extract<ProviderEvent, { kind: "subscription_changed" }>): Promise<void> {
    await this.syncSubscription(tx, await this.provider.retrieveSubscription(event.subscriptionId), event.id);
  }

  /** A paid bundle adds exactly its credits, as a top-up lot that never expires, and the money on the record. A plan's checkout does nothing here — invoice.paid grants. */
  async onBundlePaid(tx: Executor, event: Extract<ProviderEvent, { kind: "checkout_paid" }>): Promise<void> {
    const s = event.session;
    if (s.mode !== "payment" || s.metadata.kind !== "bundle") return;
    if (s.paymentStatus !== "paid") return; // a delayed payment method: async_payment_succeeded brings the paid session
    const bundle = this.deps.catalog.bundles.find((b) => b.key === s.metadata.bundleKey);
    const account = s.metadata.accountId ? await this.deps.accountRepo.findById(tx, s.metadata.accountId) : null;
    if (!bundle || !account) {
      this.deps.logger.warn("bundle checkout for an unknown bundle or account", { sessionId: s.id, metadata: s.metadata });
      return;
    }
    // keyed by the session, not the event: completed and async_payment_succeeded are two events for one payment
    await this.deps.credits.grant(tx, { owner: this.ownerOf(account), reason: "top_up", amount: bundle.credits, sourceRef: s.id, sourceEventId: event.id });
    await this.deps.payments.record(tx, {
      accountId: account.id, kind: "bundle", amount: s.amountTotal ?? 0, currency: s.currency ?? this.deps.credits.currency, description: `Bought ${bundle.name}`,
      stripeRef: s.id, paymentIntentId: s.paymentIntentId, creditSourceRef: s.id, creditsGranted: bundle.credits,
    });
  }
}
