/**
 * Credit lot — one grant of credits to an owner. Where it may be spent (the
 * platform's services, or one vendor's products), how it ranks against the
 * owner's other lots and when it dies travel with it; a charge draws on lots,
 * never on an account total. A balance is the sum of `remaining` over the lots
 * whose expiry is null or still ahead.
 *
 * `remaining` never leaves [0, amount]: the conditional updates in the
 * repository refuse, and the CHECK below backs them. Idempotency lives in the
 * indexes: one lot per source and one welcome lot per account.
 */

import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { LOT_REASONS } from "../../shared/types";
import { creditAccount } from "./credit-account.model";

export const lotReasonEnum = pgEnum("lot_reason", LOT_REASONS);

export const creditLot = pgTable(
  "credit_lot",
  {
    id: text("id").primaryKey(),
    /** the owner */
    accountId: text("account_id")
      .notNull()
      .references(() => creditAccount.id, { onDelete: "restrict" }),
    /** the vendor organization's id, no FK. Null: platform credits. Set: spendable on this vendor's products only */
    vendorOrganizationId: text("vendor_organization_id"),
    /** the catalog services this lot can pay for, sorted. Null: every service */
    serviceKeys: text("service_keys").array(),
    reason: lotReasonEnum("reason").notNull(),
    /** lower is spent first; set from LOT_PRIORITY by reason, or chosen at an admin grant */
    priority: integer("priority").notNull(),
    /** cents granted, above zero */
    amount: integer("amount").notNull(),
    /** cents left */
    remaining: integer("remaining").notNull(),
    /** null never expires */
    expiresAt: timestamp("expires_at"),
    /** what the lot came from, in the granter's terms; unique, so a repeated source grants once */
    sourceRef: text("source_ref"),
    /** the person's id, no FK — who issued an admin grant, a credit refund or a promotion */
    issuedByUserId: text("issued_by_user_id"),
    /** why it was given, in the issuer's words (an admin grant's reason); not unique, unlike source_ref */
    note: text("note"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    /** the charge: the owner's lots at one destination, in spend order */
    index("credit_lot_draw_idx").on(table.accountId, table.vendorOrganizationId, table.priority, table.expiresAt),
    index("credit_lot_account_idx").on(table.accountId, table.createdAt),
    /** one lot per source — a redelivered event or a repeated handler writes nothing */
    uniqueIndex("credit_lot_source_uniq").on(table.sourceRef).where(sql`source_ref is not null`),
    /** welcome once per account — a re-emitted hook is a no-op */
    uniqueIndex("credit_lot_welcome_uniq").on(table.accountId).where(sql`reason = 'welcome'`),
    check("credit_lot_amount_check", sql`amount > 0 and remaining >= 0 and remaining <= amount`),
  ],
);
export type CreditLotSelect = typeof creditLot.$inferSelect;
export type CreditLotInsert = typeof creditLot.$inferInsert;
