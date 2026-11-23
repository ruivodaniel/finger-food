/**
 * The slice's public vocabulary — the inert types configs, api and web share.
 *
 * A credit is one cent of the platform currency (the catalog's `currency`):
 * balances, prices, caps and the ledger are all in cents and are shown as money.
 */

/**
 * What issued a credit lot. `plan`, `top_up`, `welcome`, `admin_grant` and
 * `allocation` (created by a member's rule) are platform credits, spendable on
 * the platform's services; `vendor_refund` and `promotion` are vendor credits,
 * spendable on one vendor's products only.
 */
export const LOT_REASONS = ["plan", "top_up", "welcome", "admin_grant", "allocation", "vendor_refund", "promotion"] as const;
export type LotReason = (typeof LOT_REASONS)[number];

/**
 * The order a charge draws lots in: the lowest number first, then the soonest
 * expiry, then the oldest. Gifts before the plan's credits, those before
 * bought credits.
 */
export const LOT_PRIORITY: Record<LotReason, number> = {
  welcome: 1,
  admin_grant: 1,
  allocation: 1,
  vendor_refund: 1,
  promotion: 1,
  plan: 2,
  top_up: 3,
};

/**
 * What moved on a lot. `grant` = the lot was issued; `charge` = drawn by a
 * metered action or a purchase; `refund` = a charge reversed into its lot;
 * `expire` = the remainder lost at expiry; `take_back` = what was left of a
 * lot whose payment was refunded.
 */
export const LEDGER_REASONS = ["grant", "charge", "refund", "expire", "take_back"] as const;
export type LedgerReason = (typeof LEDGER_REASONS)[number];

/** How often a member's allocation renews, in UTC calendar periods (a week starts on Monday). */
export const ALLOCATION_PERIODS = ["day", "week", "month"] as const;
export type AllocationPeriod = (typeof ALLOCATION_PERIODS)[number];

/** What happens to what a member did not spend: it adds up, or the new period starts over. */
export const UNSPENT_MODES = ["top_up", "replace"] as const;
export type UnspentMode = (typeof UNSPENT_MODES)[number];

/** Who holds credits: an organization or a person. */
export type CreditOwner = { organizationId: string; userId?: never } | { userId: string; organizationId?: never };

/** The request scope a credits route acts in. `organization` reads the active organization from the session. */
export const CREDIT_SCOPES = ["account", "organization"] as const;
export type CreditScope = (typeof CREDIT_SCOPES)[number];

export interface CreditsSummary {
  accountId: string;
  /** the platform currency: one credit is one cent of it, where credits meet money */
  currency: string;
  /** what remains in the unexpired platform lots that pay for everything */
  balance: number;
  /** what remains in the unexpired platform lots that pay only for these services, per list */
  limited: { services: string[]; amount: number }[];
  /** what remains in the unexpired lots at each vendor */
  vendorBalances: { vendorOrganizationId: string; vendorName: string; amount: number }[];
}

export interface LotView {
  id: string;
  reason: LotReason;
  /** null: platform credits; set: spendable at this vendor only */
  vendorOrganizationId: string | null;
  /** null: pays for everything; set: only for these services */
  services: string[] | null;
  priority: number;
  amount: number;
  remaining: number;
  expiresAt: string | null;
  /** past its expiry: nothing in it can be spent */
  expired: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  lotId: string;
  /** what issued the lot this row touched */
  lotReason: LotReason;
  reason: LedgerReason;
  delta: number;
  lotRemainingAfter: number;
  serviceKey: string | null;
  userId: string | null;
  ref: string | null;
  createdAt: string;
}

/** What an organization lets one member spend, renewing each period. */
export interface Allowance {
  /** null: the rule for every member without one of their own */
  userId: string | null;
  /** this member follows the organization's rule for every member */
  inherited: boolean;
  period: AllocationPeriod;
  unspent: UnspentMode;
  /** the amount each period */
  credits: number;
  /** null: any service; set: only these */
  services: string[] | null;
  /** each period's credits are created on the organization rather than coming out of what it holds */
  createsCredits: boolean;
  spent: number;
  remaining: number;
  /** when the next period starts */
  renewsAt: string;
}

/** What saving a member's rule says. */
export interface AllowanceInput {
  credits: number;
  period: AllocationPeriod;
  unspent: UnspentMode;
  services: string[] | null;
  createsCredits: boolean;
}

/** One admin grant, as the credit grants page lists it. */
export interface CreditGrantView {
  id: string;
  owner: CreditOwner;
  ownerName: string;
  amount: number;
  remaining: number;
  /** null: pays for everything; set: only for these services */
  services: string[] | null;
  priority: number;
  expiresAt: string | null;
  expired: boolean;
  note: string | null;
  issuedByName: string | null;
  createdAt: string;
}

/** A credit owner a platform owner can grant credits to, found by name. */
export interface OwnerOption {
  owner: CreditOwner;
  name: string;
  kind: "organization" | "person";
}
