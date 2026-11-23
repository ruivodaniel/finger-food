/**
 * mountPaymentApi — the slice's single assembly point: repositories →
 * services → routers → the surface the app mounts. Nothing in here reaches
 * for app internals; everything the slice needs arrives in the options.
 */

import { Hono } from "hono";
import { priceEnvName } from "../shared/catalog";
import { DrizzlePaymentAccountRepository } from "./repositories/payment-account.repository";
import { DrizzlePaymentLedgerRepository } from "./repositories/payment-ledger.repository";
import { DrizzleProductRepository } from "./repositories/product.repository";
import { DrizzlePurchaseRepository } from "./repositories/purchase.repository";
import { DrizzleStripeEventRepository } from "./repositories/stripe-event.repository";
import { createBillingRouter } from "./routes/create-billing-router";
import { createMarketplaceRouter } from "./routes/create-marketplace-router";
import { createSellingRouter } from "./routes/create-selling-router";
import { createWebhookRouter } from "./routes/create-webhook-router";
import { BillingService } from "./services/billing.service";
import { MarketplaceService } from "./services/marketplace.service";
import { PaymentAccountService } from "./services/payment-account.service";
import { PaymentLedgerService } from "./services/payment-ledger.service";
import { SellingService } from "./services/selling.service";
import { VendorCreditsService } from "./services/vendor-credits.service";
import { WebhookService } from "./services/webhook.service";
import type { RunInTransaction } from "./shared/executor";
import { guardHooks } from "./shared/guard-hooks";
import type { MountPaymentApiOptions, MountPaymentApiResult } from "./mount-types";
import type { PaymentEnv } from "./types";

export const WEBHOOK_BASE_PATH = "/api/webhooks/stripe";

export function mountPaymentApi(options: MountPaymentApiOptions): MountPaymentApiResult {
  const hooks = guardHooks(options.hooks ?? {}, options.logger);
  const provider = options.provider ?? null;
  const priceIds = options.priceIds ?? {};
  const credits = options.credits;

  // A plan without a price list could be sold and then charge the wrong prices.
  const unpriced = options.catalog.plans.filter((plan) => !credits.hasPriceList(plan.key)).map((plan) => plan.key);
  if (unpriced.length) throw new Error(`payment: no credits price list for the plans ${unpriced.join(", ")}`);

  // With a provider, a plan or bundle without a Stripe price cannot be sold —
  // boot fails here rather than at the first checkout.
  if (provider) {
    const missing = [...options.catalog.plans, ...options.catalog.bundles].filter((item) => !priceIds[item.key]).map((item) => priceEnvName(item.key));
    if (missing.length) throw new Error(`payment: no Stripe price id for ${missing.join(", ")}`);
  }

  const accountRepo = new DrizzlePaymentAccountRepository();
  const paymentRepo = new DrizzlePaymentLedgerRepository();
  const eventRepo = new DrizzleStripeEventRepository();
  const productRepo = new DrizzleProductRepository();
  const purchaseRepo = new DrizzlePurchaseRepository();

  // Services get `db` for single statements and `runInTransaction` for the
  // multi-statement writes; the repositories are the only ones that query.
  const db = options.db;
  const runInTransaction: RunInTransaction = (run) => options.db.transaction((tx) => run(tx));

  const people = options.people;
  const payments = new PaymentLedgerService({ ledgerRepo: paymentRepo, accountRepo, credits, createId: options.createId, logger: options.logger });
  const accounts = new PaymentAccountService({
    accountRepo, purchaseRepo, paymentRepo, engine: options.engine, db, createId: options.createId, errors: options.errors, people,
  });
  const billing = new BillingService({
    accountRepo, accounts, credits, payments, provider, priceIds, catalog: options.catalog, webAppUrl: options.webAppUrl, hooks, db,
    errors: options.errors, logger: options.logger,
  });
  const selling = new SellingService({
    accountRepo, productRepo, purchaseRepo, accounts, provider, catalog: options.catalog, engine: options.engine, db,
    webAppUrl: options.webAppUrl, createId: options.createId, errors: options.errors, logger: options.logger, people,
  });
  const marketplace = new MarketplaceService({
    accountRepo, productRepo, purchaseRepo, credits, payments, accounts, provider, catalog: options.catalog, hooks, db, runInTransaction,
    webAppUrl: options.webAppUrl, createId: options.createId, errors: options.errors, logger: options.logger, people,
  });
  const vendorCredits = new VendorCreditsService({
    selling, accountRepo, credits, productRepo, purchaseRepo, catalog: options.catalog, db, runInTransaction,
    createId: options.createId, errors: options.errors, people,
  });

  // The payment events → their handlers. A paid session is a purchase (the
  // marketplace's) or a bundle (billing's); each ignores the other's.
  const webhook = provider
    ? new WebhookService({
        provider,
        eventRepo,
        runInTransaction,
        logger: options.logger,
        handlers: {
          checkout_paid: (tx, event) =>
            event.session.metadata.kind === "purchase" ? marketplace.onPurchasePaid(tx, event) : billing.onBundlePaid(tx, event),
          invoice_paid: (tx, event) => billing.onInvoicePaid(tx, event),
          subscription_changed: (tx, event) => billing.onSubscriptionChanged(tx, event),
          charge_refunded: async (tx, event) => {
            await marketplace.onChargeRefunded(tx, event);
            await payments.onChargeRefunded(tx, event);
          },
          dispute_funds: (tx, event) => payments.onDisputeFunds(tx, event),
          account_updated: (tx, event) => selling.onAccountUpdated(tx, event),
        },
      })
    : null;

  const router = new Hono<PaymentEnv>()
    .route("/", createBillingRouter({ accounts, billing, errors: options.errors }))
    .route("/", createSellingRouter({ selling, vendorCredits, errors: options.errors }))
    .route("/", createMarketplaceRouter({ marketplace, errors: options.errors }));

  return {
    router,
    webhookMount: webhook ? { basePath: WEBHOOK_BASE_PATH, router: createWebhookRouter({ webhook }) } : undefined,
    services: { accounts, payments, billing, selling, marketplace, vendorCredits, webhook },
  };
}
