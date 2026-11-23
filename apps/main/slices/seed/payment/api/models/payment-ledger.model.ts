/**
 * Payment ledger — append-only: every movement of real money on a billing
 * owner. Positive is money paid, negative money returned. An event that also
 * moves credits writes its credits rows in the same transaction; a card
 * purchase moves money only and writes only here.
 *
 * Idempotency lives in the index: one row per Stripe object and kind.
 * `payment_intent_id` is how a refund or a dispute finds the payment it
 * reverses; `credit_source_ref` and `credits_granted` say which credits that
 * payment brought, so a refund can take back what is left of them.
 */

import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { PAYMENT_KINDS } from "../../shared/types";
import { paymentAccount } from "./payment-account.model";

export const paymentKindEnum = pgEnum("payment_kind", PAYMENT_KINDS);

export const paymentLedger = pgTable(
  "payment_ledger",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => paymentAccount.id, { onDelete: "restrict" }),
    kind: paymentKindEnum("kind").notNull(),
    /** signed minor units of `currency` */
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    description: text("description").notNull(),
    /** the Stripe object (or, for a refund, the event) this row records */
    stripeRef: text("stripe_ref").notNull(),
    paymentIntentId: text("payment_intent_id"),
    /** the source the credits ledger knows this payment's credits by */
    creditSourceRef: text("credit_source_ref"),
    /** the credits this payment granted, in cents of the platform currency */
    creditsGranted: integer("credits_granted").notNull().default(0),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("payment_ledger_account_idx").on(table.accountId, table.createdAt),
    index("payment_ledger_intent_idx").on(table.paymentIntentId),
    uniqueIndex("payment_ledger_ref_uniq").on(table.stripeRef, table.kind),
  ],
);
export type PaymentLedgerSelect = typeof paymentLedger.$inferSelect;
export type PaymentLedgerInsert = typeof paymentLedger.$inferInsert;
