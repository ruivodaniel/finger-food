/**
 * The slice's public vocabulary — the inert types configs, api and web share.
 *
 * Money is integer minor units plus an ISO-4217 code. Credits are another
 * slice's: this one speaks to them through the port it declares
 * (`api/shared/credits-port.ts`).
 */

/** How a vendor may settle a purchase of a product. */
export const REFUND_POLICIES = ["money", "credits", "either"] as const;
export type RefundPolicy = (typeof REFUND_POLICIES)[number];

/** How a purchase's whole price was paid — never both. */
export const PAID_WITH = ["card", "vendor_credits"] as const;
export type PaidWith = (typeof PAID_WITH)[number];

/** Who a payment account belongs to: the active organization, or the person with no active organization. */
export type PaymentOwner = { organizationId: string; userId?: never } | { userId: string; organizationId?: never };

/** The request scope a billing route acts in. `organization` reads the active organization from the session. */
export const BILLING_SCOPES = ["account", "organization"] as const;
export type BillingScope = (typeof BILLING_SCOPES)[number];

/**
 * What moved real money. `subscription`, `bundle`, `purchase` and `invoice`
 * were paid in; `refund` and `chargeback` went back; `chargeback_reversal` is
 * a dispute won, the money back again.
 */
export const PAYMENT_KINDS = ["subscription", "bundle", "purchase", "invoice", "refund", "chargeback", "chargeback_reversal"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export interface BillingSummary {
  accountId: string;
  /** the catalog plan; null is no plan */
  planKey: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  hasCustomer: boolean;
}

/** One line of the real-money ledger: positive money paid, negative money returned. */
export interface PaymentRecord {
  id: string;
  kind: PaymentKind;
  amount: number;
  currency: string;
  description: string;
  /** the credits this payment granted, in cents of the platform currency; 0 for none */
  creditsGranted: number;
  createdAt: string;
}

export interface ProductView {
  id: string;
  /** the vendor */
  organizationId: string;
  vendorName: string;
  name: string;
  description: string | null;
  unitAmount: number;
  currency: string;
  refundPolicy: RefundPolicy;
  active: boolean;
}

/** A product as the Marketplace shows it: with whether its vendor can take a payment right now. */
export interface MarketplaceProduct extends ProductView {
  vendorCanTakePayments: boolean;
}

export interface PurchaseView {
  id: string;
  /** the buyer billing owner — the vendor's sales list names who bought */
  buyer: PaymentOwner;
  buyerName: string;
  sellerOrganizationId: string;
  sellerName: string;
  productId: string;
  productName: string;
  quantity: number;
  paidWith: PaidWith;
  amountTotal: number;
  currency: string;
  applicationFeeAmount: number;
  refundedAmount: number;
  refundedAt: string | null;
  creditsRefunded: number;
  createdAt: string;
}

/** A billing owner that bought from a vendor, once however many purchases — who a promotion may go to. */
export interface BuyerView {
  owner: PaymentOwner;
  name: string;
}

/** What a vendor issued in its own credits and still owes: the liability is the vendor's. */
export interface VendorCreditsView {
  currency: string;
  /** every credit refund and promotion ever issued, in cents */
  issued: number;
  /** what remains unspent and unexpired, in cents */
  outstanding: number;
  holders: { owner: PaymentOwner; ownerName: string; remaining: number; soonestExpiry: string | null }[];
}

export interface VendorStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
}

/** Every Stripe-hosted surface is reached the same way: a URL the browser is sent to. */
export interface CheckoutUrl {
  url: string;
}
