/**
 * Credit ledger — append-only. One row per lot touched per movement, with what
 * the lot held after it. The reason says what moved; what issued a grant is
 * the lot's own reason. Credits only: real money is the payment slice's.
 *
 * Idempotency lives in the index, not in code: a charge and a refund exist at
 * most once per (reference, lot). `user_id` names the acting member and
 * `service_key` the platform service on charge and refund rows — a member's
 * allocation is computed from these rows, never counted.
 */

import { sql } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { LEDGER_REASONS } from "../../shared/types";
import { creditAccount } from "./credit-account.model";
import { creditLot } from "./credit-lot.model";

export const ledgerReasonEnum = pgEnum("ledger_reason", LEDGER_REASONS);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => creditAccount.id, { onDelete: "restrict" }),
    /** the lot this row touched */
    lotId: text("lot_id")
      .notNull()
      .references(() => creditLot.id, { onDelete: "restrict" }),
    reason: ledgerReasonEnum("reason").notNull(),
    /** signed, cents */
    delta: integer("delta").notNull(),
    /** the lot after this row */
    lotRemainingAfter: integer("lot_remaining_after").notNull(),
    /** the platform service charged, from the catalog; null on grants, expiries and purchases */
    serviceKey: text("service_key"),
    /** the person's id, no FK — the acting member on charge and refund rows */
    userId: text("user_id"),
    /** the consumer's reference (a run id, a meteor id) or the purchase id */
    ref: text("ref"),
    /** the external event that caused this row, when one did */
    sourceEventId: text("source_event_id"),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("credit_ledger_account_idx").on(table.accountId, table.createdAt),
    /** a member's allocation: their service charges and refunds since a date */
    index("credit_ledger_member_idx").on(table.accountId, table.userId, table.createdAt),
    /** charge once, refund once, per reference and lot */
    uniqueIndex("credit_ledger_ref_uniq")
      .on(table.ref, table.reason, table.lotId)
      .where(sql`ref is not null`),
  ],
);
export type CreditLedgerSelect = typeof creditLedger.$inferSelect;
export type CreditLedgerInsert = typeof creditLedger.$inferInsert;
