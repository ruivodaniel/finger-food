/**
 * Stripe event — the idempotency claim. The webhook inserts the event id and
 * runs the handler in one transaction: a row exists exactly when the event was
 * processed to the end; a duplicate delivery fails the insert and answers 200
 * without touching anything; a throwing handler rolls the claim back so Stripe
 * retries. No status, payload or error columns — they would always read
 * processed and null.
 */

import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const paymentStripeEvent = pgTable(
  "stripe_event",
  {
    /** MIRROR Event.id — inserting it is the claim */
    id: text("id").primaryKey(),
    /** MIRROR Event.type — for humans grepping */
    type: text("type").notNull(),
    /** received at */
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [index("stripe_event_type_idx").on(table.type, table.createdAt)],
);
export type PaymentStripeEventSelect = typeof paymentStripeEvent.$inferSelect;
