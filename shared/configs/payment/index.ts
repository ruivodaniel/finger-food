/**
 * Payment — the catalog
 *
 * The plans, the bundles and the marketplace terms, as data. Credit amounts
 * are in cents of the platform currency: one credit is one cent. What a plan
 * or a bundle costs in money is not here: each key maps to a Stripe price id
 * through the environment (`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_SMALL`, …)
 * and Checkout shows it. What each service costs under a plan is the price
 * list of the same key in `@configs/credits`.
 * The catalog validates on import, so a bad entry fails dev, CI and boot alike.
 *
 * PLACEHOLDERS: the amounts below are the design's stand-ins until product
 * sets the real ones. The Stripe prices of the plans and bundles must match
 * whatever is chosen here.
 *
 * `platformFeePercent` is the share of each marketplace card sale the
 * platform keeps, gross of Stripe's processing fees (the vendor pays those).
 */

import { definePaymentCatalog } from "@modules/payment/shared";

export const paymentCatalog = definePaymentCatalog({
  plans: [
    { key: "starter", name: "Starter", credits: 2000 },
    { key: "pro", name: "Pro", credits: 6000 },
  ],
  bundles: [
    { key: "small", name: "Small bundle", credits: 1000 },
    { key: "large", name: "Large bundle", credits: 5000 },
  ],
  marketplace: {
    platformFeePercent: 10,
    sellerOrgTypes: ["company"],
    // the Stripe platform account is Portuguese; vendors open their Stripe account there
    sellerCountry: "pt",
    currencies: ["eur"],
  },
  // a vendor's credit refund lasts six months (ruled 2026-10-12)
  vendorCredits: { refundExpiresInDays: 180 },
});
