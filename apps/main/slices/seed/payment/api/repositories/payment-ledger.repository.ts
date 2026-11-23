/**
 * Payment ledger repository — append-only data access for `payment_ledger`.
 * `append` surfaces the table's idempotency as data: a row that hits the
 * (ref, kind) index is not written and `null` comes back.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { paymentLedger, type PaymentLedgerSelect } from "../models/payment-ledger.model";
import type { PaymentKind } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface PaymentRow {
  id: string;
  accountId: string;
  kind: PaymentKind;
  amount: number;
  currency: string;
  description: string;
  stripeRef: string;
  paymentIntentId?: string | null;
  creditSourceRef?: string | null;
  creditsGranted?: number;
}

export interface PaymentPage {
  rows: PaymentLedgerSelect[];
  total: number;
}

export interface PaymentLedgerRepository {
  /** The written row, or null when the idempotency index refused it. */
  append(tx: Executor, row: PaymentRow): Promise<PaymentLedgerSelect | null>;
  /** The money paid in under a payment intent — what a refund or a dispute reverses. */
  paidByIntent(executor: Executor, paymentIntentId: string): Promise<PaymentLedgerSelect | null>;
  /** The money refunded so far under a payment intent, as a positive amount. */
  refundedByIntent(executor: Executor, paymentIntentId: string): Promise<number>;
  listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<PaymentPage>;
}

const PAID_IN: PaymentKind[] = ["subscription", "bundle", "purchase", "invoice"];

export class DrizzlePaymentLedgerRepository implements PaymentLedgerRepository {
  async append(tx: Executor, row: PaymentRow): Promise<PaymentLedgerSelect | null> {
    const rows = await tx
      .insert(paymentLedger)
      .values({
        ...row,
        paymentIntentId: row.paymentIntentId ?? null,
        creditSourceRef: row.creditSourceRef ?? null,
        creditsGranted: row.creditsGranted ?? 0,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  }

  async paidByIntent(executor: Executor, paymentIntentId: string): Promise<PaymentLedgerSelect | null> {
    const rows = await executor
      .select()
      .from(paymentLedger)
      .where(and(eq(paymentLedger.paymentIntentId, paymentIntentId), inArray(paymentLedger.kind, PAID_IN)))
      .orderBy(asc(paymentLedger.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async refundedByIntent(executor: Executor, paymentIntentId: string): Promise<number> {
    const [{ refunded }] = await executor
      .select({ refunded: sql<number>`coalesce(-sum(${paymentLedger.amount}), 0)::int` })
      .from(paymentLedger)
      .where(and(eq(paymentLedger.paymentIntentId, paymentIntentId), eq(paymentLedger.kind, "refund")));
    return refunded;
  }

  async listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<PaymentPage> {
    const where = eq(paymentLedger.accountId, accountId);
    const rows = await executor
      .select()
      .from(paymentLedger)
      .where(where)
      .orderBy(desc(paymentLedger.createdAt), desc(paymentLedger.id))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(paymentLedger).where(where);
    return { rows, total };
  }
}
