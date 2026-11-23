/**
 * What this slice needs from a credits ledger, in its own words. It imports
 * nothing from the slice that provides it: the app passes an implementation at
 * mount, and every write runs inside the caller's transaction, so a payment
 * row and the credits it brought commit together or not at all.
 *
 * Amounts are cents of the platform currency (`currency`).
 */

import type { PaymentOwner } from "../../shared/types";
import type { Executor } from "./executor";

export type CreditGrantReason = "plan" | "top_up" | "vendor_refund" | "promotion";

export interface CreditGrantRequest {
  owner: PaymentOwner;
  reason: CreditGrantReason;
  amount: number;
  expiresAt?: Date | null;
  /** set for vendor credits: spendable at this vendor only */
  vendorOrganizationId?: string | null;
  /** what the credits came from; the same source grants once */
  sourceRef?: string | null;
  issuedByUserId?: string | null;
  /** the purchase a vendor refund settles */
  ref?: string | null;
  sourceEventId?: string | null;
}

export interface VendorCreditsIssued {
  issued: number;
  holders: { organizationId: string | null; userId: string | null; remaining: number; soonestExpiry: Date | null }[];
}

export interface CreditsPort {
  /** the platform currency, lower case */
  readonly currency: string;
  /** Whether a price list exists — every plan key needs one. */
  hasPriceList(key: string): boolean;
  /** The list the owner pays by follows the plan; null is no plan. */
  setPriceList(tx: Executor, owner: PaymentOwner, key: string | null): Promise<void>;
  /** Null when the source was granted before. */
  grant(tx: Executor, input: CreditGrantRequest): Promise<{ id: string } | null>;
  /** The owner's live plan credits end now. */
  endLots(tx: Executor, owner: PaymentOwner, reason: "plan", meta?: { sourceEventId?: string }): Promise<void>;
  /** What is left of a source's credits, up to `upTo`, never below zero. The amount taken. */
  takeBack(tx: Executor, owner: PaymentOwner, input: { sourceRef: string; upTo: number; sourceEventId: string }): Promise<number>;
  /** All or nothing: the price from what the buyer holds at the vendor. */
  chargeVendor(
    tx: Executor,
    input: { owner: PaymentOwner; vendorOrganizationId: string; amount: number; purchaseId: string; userId: string },
  ): Promise<{ ok: true } | { ok: false; balance: number }>;
  /** What a vendor issued in its own credits, and who still holds some. */
  issuedBy(executor: Executor, vendorOrganizationId: string): Promise<VendorCreditsIssued>;
}
