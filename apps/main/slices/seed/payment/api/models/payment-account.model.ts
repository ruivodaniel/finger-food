/**
 * Payment account — one row per billing owner: the owner on both sides of
 * Stripe, the Customer when buying (plan, bundles), the connected account when
 * selling. Carries the subscription mirror. A balance is never a column here:
 * it is the sum of what remains in the owner's unexpired credit lots.
 *
 * The owner is an organization OR a user — two nullable columns with a CHECK
 * (the access-control DSL targets columns, so one owner_id would not do). The
 * `stripe_*` columns copy the Stripe field named in their comment and nothing
 * else; `plan_key` is derived from the subscription's price id at the moment
 * the mirror is written.
 */

import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const paymentAccount = pgTable(
  "payment_account",
  {
    id: text("id").primaryKey(),
    /** uom organization.id — plain text, no cross-slice FK; exactly one of the two owner columns is set */
    organizationId: text("organization_id"),
    /** uom user.id — plain text, no cross-slice FK */
    userId: text("user_id"),
    /** MIRROR Customer.id — created at the first plan or bundle checkout */
    stripeCustomerId: text("stripe_customer_id"),
    /** MIRROR Subscription.id */
    stripeSubscriptionId: text("stripe_subscription_id"),
    /** DERIVED Subscription.items[0].price.id → the catalog key; null is the free plan */
    planKey: text("plan_key"),
    /** MIRROR Subscription.status, verbatim — text, not an enum, so a new Stripe status is not a migration */
    subscriptionStatus: text("subscription_status"),
    /** MIRROR Subscription.items[0].current_period_end — of the last PAID period: a failed renewal moves Stripe's, not ours */
    currentPeriodEnd: timestamp("current_period_end"),
    /** MIRROR Account.id — the connected account; organization rows only */
    stripeAccountId: text("stripe_account_id"),
    /** MIRROR Account.charges_enabled — refreshed when the selling page loads and by account.updated */
    chargesEnabled: boolean("charges_enabled").notNull().default(false),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("payment_account_organization_uniq")
      .on(table.organizationId)
      .where(sql`organization_id is not null`),
    uniqueIndex("payment_account_user_uniq")
      .on(table.userId)
      .where(sql`user_id is not null`),
    check("payment_account_one_owner_check", sql`(organization_id is null) <> (user_id is null)`),
  ],
);
export type PaymentAccountSelect = typeof paymentAccount.$inferSelect;
export type PaymentAccountInsert = typeof paymentAccount.$inferInsert;
