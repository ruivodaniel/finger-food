/**
 * Purchase — born paid, never before: written by the checkout.session.completed
 * handler for a card purchase, or in the credits purchase's own transaction.
 * A card purchase's charge lives on the vendor's connected account (a direct
 * charge), so its two Stripe ids are ids on that account; a credits purchase
 * has none and moves no money.
 *
 * What was given back is two numbers: money refunded through Stripe (mirrored
 * from the vendor's dashboard) and credits the vendor issued as credit
 * refunds; fully refunded is derived. No CHECK caps their sum: the money
 * refund happens in Stripe, outside this slice, and its mirror must always be
 * written. The cap holds where the slice decides — a credit refund is issued
 * only up to what is still unsettled.
 */

import { sql } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { PAID_WITH } from "../../shared/types";
import { paymentAccount } from "./payment-account.model";
import { paymentProduct } from "./product.model";

export const paidWithEnum = pgEnum("paid_with", PAID_WITH);

export const paymentPurchase = pgTable(
  "purchase",
  {
    id: text("id").primaryKey(),
    /** the buyer's payment account */
    accountId: text("account_id")
      .notNull()
      .references(() => paymentAccount.id, { onDelete: "restrict" }),
    /** uom organization.id, no FK — the vendor; the sales list reads this */
    sellerOrganizationId: text("seller_organization_id").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => paymentProduct.id, { onDelete: "restrict" }),
    /** snapshot at purchase */
    productName: text("product_name").notNull(),
    quantity: integer("quantity").notNull(),
    /** how the whole price was paid; never both */
    paidWith: paidWithEnum("paid_with").notNull(),
    /** MIRROR Session.amount_total for a card purchase; the price for a credits purchase. Minor units */
    amountTotal: integer("amount_total").notNull(),
    /** MIRROR Session.currency for a card purchase; the product currency for a credits purchase */
    currency: text("currency").notNull(),
    /** computed at checkout = PaymentIntent.application_fee_amount; zero for a credits purchase; stays with the platform on a refund */
    applicationFeeAmount: integer("application_fee_amount").notNull(),
    /** MIRROR Session.id, on the vendor's account; null for a credits purchase */
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    /** MIRROR Session.payment_intent, on the vendor's account; null for a credits purchase */
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** MIRROR Charge.amount_refunded — money returned through Stripe */
    refundedAmount: integer("refunded_amount").notNull().default(0),
    /** the time of the latest money refund event */
    refundedAt: timestamp("refunded_at"),
    /** cents the vendor issued back as credit refunds against this purchase */
    creditsRefunded: integer("credits_refunded").notNull().default(0),
    /** the paid moment */
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    /** completed-handler idempotency */
    uniqueIndex("purchase_checkout_session_uniq").on(table.stripeCheckoutSessionId).where(sql`stripe_checkout_session_id is not null`),
    /** charge.refunded lookup */
    uniqueIndex("purchase_payment_intent_uniq").on(table.stripePaymentIntentId).where(sql`stripe_payment_intent_id is not null`),
    index("purchase_buyer_idx").on(table.accountId, table.createdAt),
    index("purchase_seller_idx").on(table.sellerOrganizationId, table.createdAt),
  ],
);
export type PaymentPurchaseSelect = typeof paymentPurchase.$inferSelect;
export type PaymentPurchaseInsert = typeof paymentPurchase.$inferInsert;
