/**
 * What the slice tells the app, after the fact — one callback per event, the
 * bare fact only. The app wires reactions at mount; a throwing callback is
 * logged and never breaks the emitter.
 */
import type { PaymentOwner } from "./types";

export interface PaymentHooks {
  /** A renewal payment failed and Stripe moved the subscription to past_due. */
  onSubscriptionPastDue?: (payload: { owner: PaymentOwner }) => void | Promise<void>;
  /** A purchase was paid on the vendor's connected account. */
  onPurchaseCompleted?: (payload: {
    purchaseId: string;
    sellerOrganizationId: string;
    owner: PaymentOwner;
  }) => void | Promise<void>;
}
