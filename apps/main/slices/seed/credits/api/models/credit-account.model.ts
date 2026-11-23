/**
 * Credit account — one row per credit owner: the row every lot, ledger row and
 * allowance hangs from, and the row a movement locks. A balance is never a
 * column here: it is the sum of what remains in the owner's unexpired lots.
 *
 * The owner is an organization OR a user — two nullable columns with a CHECK
 * (the access-control DSL targets columns, so one owner_id would not do).
 * `price_list` says which of the catalog's price lists the owner pays by;
 * null is the catalog's default.
 */

import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const creditAccount = pgTable(
  "credit_account",
  {
    id: text("id").primaryKey(),
    /** the organization's id — plain text, no cross-slice FK; exactly one of the two owner columns is set */
    organizationId: text("organization_id"),
    /** the person's id — plain text, no cross-slice FK */
    userId: text("user_id"),
    /** the catalog's price list key; null is the default list */
    priceList: text("price_list"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("credit_account_organization_uniq")
      .on(table.organizationId)
      .where(sql`organization_id is not null`),
    uniqueIndex("credit_account_user_uniq")
      .on(table.userId)
      .where(sql`user_id is not null`),
    check("credit_account_one_owner_check", sql`(organization_id is null) <> (user_id is null)`),
  ],
);
export type CreditAccountSelect = typeof creditAccount.$inferSelect;
export type CreditAccountInsert = typeof creditAccount.$inferInsert;
