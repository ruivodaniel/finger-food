/**
 * Mount types — the options an app supplies and the surface it receives.
 */

import type { Ac } from "@libs/gated-scoped-ac";
import type { Hono } from "hono";
import type { PaymentCatalog } from "../shared/catalog";
import type { PaymentHooks } from "../shared/hooks";
import type { BillingService } from "./services/billing.service";
import type { MarketplaceService } from "./services/marketplace.service";
import type { PaymentAccountService } from "./services/payment-account.service";
import type { PaymentLedgerService } from "./services/payment-ledger.service";
import type { SellingService } from "./services/selling.service";
import type { VendorCreditsService } from "./services/vendor-credits.service";
import type { WebhookService } from "./services/webhook.service";
import type { CreditsPort } from "./shared/credits-port";
import type { PaymentDb } from "./shared/executor";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import type { People } from "./shared/owner-names";
import type { PaymentProvider } from "./stripe/provider";
import type { PaymentEnv } from "./types";

export interface MountPaymentApiOptions {
  /** Drizzle database instance (the app's — the slice's tables flow in via ./models). */
  db: PaymentDb;
  /** Id factory for domain rows (cuid2 in the seed). */
  createId: () => string;
  /** The product's catalog (`@configs/payment`), validated at import. */
  catalog: PaymentCatalog;
  /** The scoped-AC engine (createAc) — the app's config-bound singleton; the slice never builds one. */
  engine: Ac;
  /** The credits ledger this slice grants, takes back and charges vendor credits through. */
  credits: CreditsPort;
  /** Where the web app lives — Stripe's return URLs are built on it. */
  webAppUrl: string;
  /**
   * The payment provider (`createStripeProvider` in the app, a fake in tests).
   * Absent, the Stripe-backed routes answer 503 and no webhook mounts.
   */
  provider?: PaymentProvider;
  /** Catalog key → Stripe price id. With a provider, every plan and bundle needs one, or the mount throws. */
  priceIds?: Record<string, string>;
  hooks?: PaymentHooks;
  /** The user-organization slice's organization and user-profile services: they name vendors and buyers. */
  people: People;
  logger: ModuleLogger;
  errors: ModuleErrors;
}

export interface MountPaymentApiResult {
  /** The gated routes, for the app's `/api/client` (after its session and access-control middleware). */
  router: Hono<PaymentEnv>;
  /** The provider's webhook endpoints — mounted by the app BEFORE any session middleware. Present only with a provider. */
  webhookMount?: { basePath: string; router: Hono<PaymentEnv> };
  /** Server-side service handles for non-HTTP callers (seeds, tests). */
  services: {
    accounts: PaymentAccountService;
    payments: PaymentLedgerService;
    billing: BillingService;
    selling: SellingService;
    marketplace: MarketplaceService;
    vendorCredits: VendorCreditsService;
    webhook: WebhookService | null;
  };
}
