/**
 * The slice's web paths, declared once: the route definitions and the return
 * URLs the API builds for Stripe (`?checkout=…`, `?onboarding=…`) read the
 * same constants, so the two cannot drift.
 */
export const paymentPaths = {
  personalBilling: "/my/settings/billing",
  organizationBilling: (organizationId: string) => `/organizations/${organizationId}/billing`,
  selling: (organizationId: string) => `/organizations/${organizationId}/selling`,
  marketplace: "/marketplace",
  product: (productId: string) => `/marketplace/${productId}`,
} as const;

/** The query the browser comes back with; the page reads it once and strips it. */
export const CHECKOUT_RESULTS = ["success", "cancel"] as const;
export const ONBOARDING_RESULTS = ["return", "refresh"] as const;
