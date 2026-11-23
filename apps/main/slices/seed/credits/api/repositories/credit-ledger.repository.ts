/**
 * Credit ledger repository — append-only data access for `credit_ledger`.
 * `append` surfaces the table's idempotency as data: a row that hits the
 * (ref, reason, lot) index is not written and `null` comes back, so a retried
 * charge or a repeated refund writes nothing without any code remembering it.
 */

import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { creditLedger, type CreditLedgerSelect } from "../models/credit-ledger.model";
import { creditLot } from "../models/credit-lot.model";
import type { LedgerReason, LotReason } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface LedgerRow {
  id: string;
  accountId: string;
  lotId: string;
  reason: LedgerReason;
  delta: number;
  lotRemainingAfter: number;
  serviceKey?: string | null;
  userId?: string | null;
  ref?: string | null;
  sourceEventId?: string | null;
}

/** A ledger row with the reason of the lot it touched — what the ledger page names the lot by. */
export type LedgerRowWithLot = CreditLedgerSelect & { lotReason: LotReason };

export interface LedgerPage {
  rows: LedgerRowWithLot[];
  total: number;
}

export interface CreditLedgerRepository {
  /** The written row, or null when the idempotency index refused it. */
  append(tx: Executor, row: LedgerRow): Promise<CreditLedgerSelect | null>;
  listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LedgerPage>;
  findByRef(executor: Executor, ref: string, reason: LedgerReason): Promise<CreditLedgerSelect[]>;
  /** The member's net spend on platform services since `since`: −Σ delta of their service charge and refund rows. */
  spentByMemberSince(executor: Executor, accountId: string, userId: string, since: Date): Promise<number>;
}

export class DrizzleCreditLedgerRepository implements CreditLedgerRepository {
  async append(tx: Executor, row: LedgerRow): Promise<CreditLedgerSelect | null> {
    const rows = await tx
      .insert(creditLedger)
      .values({
        ...row,
        serviceKey: row.serviceKey ?? null,
        userId: row.userId ?? null,
        ref: row.ref ?? null,
        sourceEventId: row.sourceEventId ?? null,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  }

  async listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LedgerPage> {
    const where = eq(creditLedger.accountId, accountId);
    const rows = await executor
      .select({ row: creditLedger, lotReason: creditLot.reason })
      .from(creditLedger)
      .innerJoin(creditLot, eq(creditLot.id, creditLedger.lotId))
      .where(where)
      .orderBy(desc(creditLedger.createdAt), desc(creditLedger.id))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(creditLedger).where(where);
    return { rows: rows.map((r) => ({ ...r.row, lotReason: r.lotReason })), total };
  }

  async findByRef(executor: Executor, ref: string, reason: LedgerReason): Promise<CreditLedgerSelect[]> {
    return executor
      .select()
      .from(creditLedger)
      .where(and(eq(creditLedger.ref, ref), eq(creditLedger.reason, reason)));
  }

  async spentByMemberSince(executor: Executor, accountId: string, userId: string, since: Date): Promise<number> {
    // service rows only: a purchase paid in vendor credits is never a charge against an allowance
    const [{ spent }] = await executor
      .select({ spent: sql<number>`coalesce(-sum(${creditLedger.delta}), 0)::int` })
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.accountId, accountId),
          eq(creditLedger.userId, userId),
          inArray(creditLedger.reason, ["charge", "refund"]),
          isNotNull(creditLedger.serviceKey),
          gte(creditLedger.createdAt, since),
        ),
      );
    return spent;
  }
}
