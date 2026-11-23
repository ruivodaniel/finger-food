// Web-surface types — the slice's frontend config and the adapters the app
// hands it. A seed slice never imports another slice's hooks or services: what
// it needs from the session (the active organization) and from the credits
// (the prices and what the owner holds at vendors) arrives through these.

import type { PaymentCatalog } from "../shared/catalog";
import type { BillingScope } from "../shared/types";

export interface PaymentWebConfig {
  /** API origin, e.g. http://localhost:3000 (no trailing slash). */
  apiBaseUrl: string;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
  /** The product's catalog — the plans and bundles the pages offer (`@configs/payment`). */
  catalog: PaymentCatalog;
  /** The request header the API reads the target organization from (the seed's session convention). */
  activeOrganizationHeader?: string;
  /** Stripe runs in test mode: the buttons that open Stripe name the test card beside them. */
  stripeTestMode?: boolean;
}

/** The organization the caller is acting in — the app reads it off its session. */
export interface ActiveOrganization {
  id: string;
  name: string;
}

/** Toast adapter — optional user feedback. */
export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
  info?: (message: string) => void;
}

/** What an owner holds at vendors, for the buyer's screens; null while unknown or not the caller's to see. */
export interface VendorHoldings {
  currency: string;
  vendors: { vendorOrganizationId: string; vendorName: string; amount: number }[];
}

/** What the billing and buying screens need from the credits. */
export interface CreditsAdapter {
  /** the platform currency */
  currency: string;
  /** the metered services, as the plan card lists them */
  services: readonly { key: string; name: string; unit: string }[];
  /** what one unit of each service costs under a plan, in cents; null is no plan */
  pricesFor: (planKey: string | null) => Readonly<Record<string, number>>;
  /** A hook: what the target holds at vendors. */
  useVendorHoldings: (target: { scope: BillingScope; organizationId: string | null }) => VendorHoldings | null;
  /** The credits changed here: whatever shows them looks again. */
  refresh: () => void;
}

export interface MountPaymentWebOptions {
  config: PaymentWebConfig;
  credits: CreditsAdapter;
  /** A hook: the organization the caller is acting in, null when none. */
  useActiveOrganization: () => ActiveOrganization | null;
  /** Moves to an in-app path through the app's router; a plain navigation without it. */
  navigate?: (path: string) => void;
  toast?: ToastAdapter;
}
