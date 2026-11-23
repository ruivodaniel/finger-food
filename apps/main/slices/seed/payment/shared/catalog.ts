/**
 * The catalog DSL — what a product configures in `configs/payment`: the plans,
 * the bundles and the marketplace terms. Pure data, validated at import so a
 * bad catalog fails the build and the boot alike.
 *
 * Credit amounts are cents of the platform currency — one credit is one cent.
 * What a plan or a bundle costs in money is Stripe's: each key maps to a
 * Stripe price id through the environment (one `STRIPE_PRICE_<KEY>` per key).
 * What a plan's holder pays for each service is the credits slice's price list
 * of the same key.
 */

export interface PaymentPlan {
  /** stable key; upper-cased it names the env var that holds the Stripe price id; it also names the plan's price list */
  key: string;
  name: string;
  /** cents of credits granted each paid period, expiring with the period; 0 grants none */
  credits: number;
  features?: readonly string[];
}

export interface PaymentBundle {
  key: string;
  name: string;
  /** cents of credits added when the bundle is paid; they never expire */
  credits: number;
}

export interface MarketplaceTerms {
  /** the share of each card sale the platform keeps, in percent (0–100); Stripe bills its processing fees to the vendor */
  platformFeePercent: number;
  /** the organization types that may onboard as vendors */
  sellerOrgTypes: readonly string[];
  /** ISO-3166 alpha-2, lower case: the country a vendor's Stripe account is opened in (Stripe needs it up front) */
  sellerCountry: string;
  /** ISO-4217 codes, lower case, a product may be priced in */
  currencies: readonly string[];
}

export interface PaymentCatalog {
  plans: readonly PaymentPlan[];
  bundles: readonly PaymentBundle[];
  marketplace: MarketplaceTerms;
  /** a vendor's credit refund expires after these days (a promotion carries the date the vendor chooses); null never expires */
  vendorCredits: { refundExpiresInDays: number | null };
}

const isKey = (s: string) => /^[a-z][a-z0-9_]*$/.test(s);
const isNonNegativeInt = (n: number) => Number.isInteger(n) && n >= 0;
const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;
const isCurrency = (s: string) => /^[a-z]{3}$/.test(s);

/** Every reason the catalog is wrong, or an empty list. */
export function validatePaymentCatalog(c: PaymentCatalog): string[] {
  const problems: string[] = [];

  const keys = new Set<string>();
  for (const p of c.plans) {
    if (!isKey(p.key)) problems.push(`plan key "${p.key}" must be a lower-case identifier`);
    if (keys.has(p.key)) problems.push(`key "${p.key}" is used twice`);
    keys.add(p.key);
    if (!p.name) problems.push(`plan "${p.key}" has no name`);
    if (!isNonNegativeInt(p.credits)) problems.push(`plan "${p.key}" credits must be a non-negative integer`);
  }
  if (c.bundles.length === 0) problems.push("at least one bundle is required");
  for (const b of c.bundles) {
    if (!isKey(b.key)) problems.push(`bundle key "${b.key}" must be a lower-case identifier`);
    if (keys.has(b.key)) problems.push(`key "${b.key}" is used twice`);
    keys.add(b.key);
    if (!b.name) problems.push(`bundle "${b.key}" has no name`);
    if (!isPositiveInt(b.credits)) problems.push(`bundle "${b.key}" credits must be a positive integer`);
  }

  if (c.vendorCredits.refundExpiresInDays !== null && !isPositiveInt(c.vendorCredits.refundExpiresInDays))
    problems.push("vendorCredits.refundExpiresInDays must be a positive integer or null");

  const m = c.marketplace;
  if (!(typeof m.platformFeePercent === "number" && m.platformFeePercent >= 0 && m.platformFeePercent <= 100))
    problems.push("marketplace.platformFeePercent must be between 0 and 100");
  if (m.sellerOrgTypes.length === 0) problems.push("marketplace.sellerOrgTypes must name at least one organization type");
  if (!/^[a-z]{2}$/.test(m.sellerCountry)) problems.push(`seller country "${m.sellerCountry}" must be a lower-case ISO-3166 alpha-2 code`);
  if (m.currencies.length === 0) problems.push("marketplace.currencies must name at least one currency");
  for (const cur of m.currencies) if (!isCurrency(cur)) problems.push(`currency "${cur}" must be a lower-case ISO-4217 code`);
  return problems;
}

/** Declare the catalog; throws with every problem when it is not sound. */
export function definePaymentCatalog(c: PaymentCatalog): PaymentCatalog {
  const problems = validatePaymentCatalog(c);
  if (problems.length) throw new Error(`payment catalog: ${problems.join("; ")}`);
  return c;
}

/** The env var name that holds a key's Stripe price id. */
export const priceEnvName = (key: string) => `STRIPE_PRICE_${key.toUpperCase()}`;

/** The platform fee for a total, in the same minor units, rounded to the nearest unit. */
export const platformFeeFor = (amountTotal: number, platformFeePercent: number) =>
  Math.round((amountTotal * platformFeePercent) / 100);
