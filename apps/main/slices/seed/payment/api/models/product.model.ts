/**
 * Product — a vendor organization's catalog item. Priced here, in minor units
 * of one currency, and sent inline to Checkout at the moment of sale; Stripe
 * holds no copy. Archiving (`active = false`) hides it from the marketplace;
 * purchases keep their own snapshot of name and price. The refund policy says
 * how the vendor may settle a purchase of it: money through Stripe, its own
 * credits, or either.
 */

import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { REFUND_POLICIES } from "../../shared/types";

export const refundPolicyEnum = pgEnum("refund_policy", REFUND_POLICIES);

export const paymentProduct = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    /** uom organization.id, no FK — the seller; the access rule targets it */
    organizationId: text("organization_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** minor units, above zero */
    unitAmount: integer("unit_amount").notNull(),
    /** ISO-4217, lower case, one of the catalog's currencies */
    currency: text("currency").notNull(),
    refundPolicy: refundPolicyEnum("refund_policy").notNull().default("money"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("product_organization_idx").on(table.organizationId),
    /** the marketplace listing */
    index("product_marketplace_idx").on(table.createdAt).where(sql`active`),
    check("product_unit_amount_check", sql`unit_amount > 0`),
  ],
);
export type PaymentProductSelect = typeof paymentProduct.$inferSelect;
export type PaymentProductInsert = typeof paymentProduct.$inferInsert;
