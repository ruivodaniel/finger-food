/**
 * Credit lot repository — data access for `credit_lot`. No logic: the ledger
 * service decides what to draw and what to write off.
 *
 * `insert` surfaces the table's idempotency as data: a lot that hits the
 * source or the welcome index is not written and `null` comes back. `take`
 * and `give` are the only statements that move `remaining`, each a
 * conditional UPDATE that refuses to leave [0, amount], so the invariant
 * lives in the database and not in a read-modify-save.
 *
 * "Live" means: credits remaining and no expiry passed at `now`. The caller
 * passes `now` so one clock rules a whole transaction (and the tests move it).
 */

import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { creditAccount } from "../models/credit-account.model";
import { creditLot, type CreditLotSelect } from "../models/credit-lot.model";
import type { LotReason } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface LotRow {
  id: string;
  accountId: string;
  vendorOrganizationId?: string | null;
  serviceKeys?: string[] | null;
  reason: LotReason;
  priority: number;
  amount: number;
  expiresAt?: Date | null;
  sourceRef?: string | null;
  issuedByUserId?: string | null;
  note?: string | null;
}

export interface LotPage {
  rows: CreditLotSelect[];
  total: number;
}

/** An admin grant with its owner's columns — what the credit grants page lists. */
export type GrantWithOwner = CreditLotSelect & { ownerOrganizationId: string | null; ownerUserId: string | null };

/** What a vendor has issued in its own credits, and who still holds some. */
export interface VendorCreditsTotals {
  /** every credit refund and promotion ever issued, in cents */
  issued: number;
  /** per holder: what remains in their live lots at this vendor, and the soonest of those lots' expiries */
  holders: { organizationId: string | null; userId: string | null; remaining: number; soonestExpiry: Date | null }[];
}

export interface CreditLotRepository {
  /** The written lot (full), or null when an idempotency index refused it. */
  insert(tx: Executor, row: LotRow): Promise<CreditLotSelect | null>;
  /** The lot issued for a source — what a refund of that source takes back from. */
  findBySource(executor: Executor, sourceRef: string): Promise<CreditLotSelect | null>;
  /**
   * The live lots at one destination (null = the platform), in spend order:
   * priority, lots limited to some services before general ones, soonest
   * expiry, oldest. With `service`, only the lots that can pay for it.
   */
  spendable(tx: Executor, accountId: string, vendorOrganizationId: string | null, now: Date, service?: string): Promise<CreditLotSelect[]>;
  /** Lots past their expiry that still hold credits — owed an expire row. */
  expiredWithRemaining(tx: Executor, accountId: string, now: Date): Promise<CreditLotSelect[]>;
  /** Live lots of one reason — the plan lot a plan change or a cancel ends. */
  liveByReason(tx: Executor, accountId: string, reason: LotReason, now: Date): Promise<CreditLotSelect[]>;
  /** `remaining -= amount`; the new remaining, or null when it would go below zero. */
  take(tx: Executor, lotId: string, amount: number): Promise<number | null>;
  /** `remaining += amount`; the new remaining, or null when it would pass the lot's amount. */
  give(tx: Executor, lotId: string, amount: number): Promise<number | null>;
  /** What remains in the live lots, per destination (null = the platform) and list of services (null = every service). */
  balances(executor: Executor, accountId: string, now: Date): Promise<{ vendorOrganizationId: string | null; serviceKeys: string[] | null; amount: number }[]>;
  /** The account's lots, newest first. */
  listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LotPage>;
  /** A vendor's own credits (credit refunds and promotions): issued in all, and held live per owner. */
  vendorCredits(executor: Executor, vendorOrganizationId: string, now: Date): Promise<VendorCreditsTotals>;
  /** Every admin grant on the platform, newest first, with its owner. */
  listGrants(executor: Executor, page: { page: number; pageSize: number }): Promise<{ rows: GrantWithOwner[]; total: number }>;
}

const live = (now: Date) => and(gt(creditLot.remaining, 0), or(isNull(creditLot.expiresAt), gt(creditLot.expiresAt, now)));
const at = (vendorOrganizationId: string | null) =>
  vendorOrganizationId == null ? isNull(creditLot.vendorOrganizationId) : eq(creditLot.vendorOrganizationId, vendorOrganizationId);
const paysFor = (service: string) => or(isNull(creditLot.serviceKeys), sql`${service} = any(${creditLot.serviceKeys})`);

export class DrizzleCreditLotRepository implements CreditLotRepository {
  async insert(tx: Executor, row: LotRow): Promise<CreditLotSelect | null> {
    const rows = await tx
      .insert(creditLot)
      .values({
        ...row,
        vendorOrganizationId: row.vendorOrganizationId ?? null,
        serviceKeys: row.serviceKeys ?? null,
        remaining: row.amount,
        expiresAt: row.expiresAt ?? null,
        sourceRef: row.sourceRef ?? null,
        issuedByUserId: row.issuedByUserId ?? null,
        note: row.note ?? null,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  }

  async findBySource(executor: Executor, sourceRef: string): Promise<CreditLotSelect | null> {
    const rows = await executor.select().from(creditLot).where(eq(creditLot.sourceRef, sourceRef)).limit(1);
    return rows[0] ?? null;
  }

  async spendable(tx: Executor, accountId: string, vendorOrganizationId: string | null, now: Date, service?: string): Promise<CreditLotSelect[]> {
    return tx
      .select()
      .from(creditLot)
      .where(and(eq(creditLot.accountId, accountId), at(vendorOrganizationId), live(now), service == null ? undefined : paysFor(service)))
      .orderBy(asc(creditLot.priority), sql`${creditLot.serviceKeys} is null`, sql`${creditLot.expiresAt} asc nulls last`, asc(creditLot.createdAt), asc(creditLot.id));
  }

  async expiredWithRemaining(tx: Executor, accountId: string, now: Date): Promise<CreditLotSelect[]> {
    return tx
      .select()
      .from(creditLot)
      .where(and(eq(creditLot.accountId, accountId), gt(creditLot.remaining, 0), lte(creditLot.expiresAt, now)));
  }

  async liveByReason(tx: Executor, accountId: string, reason: LotReason, now: Date): Promise<CreditLotSelect[]> {
    return tx
      .select()
      .from(creditLot)
      .where(and(eq(creditLot.accountId, accountId), eq(creditLot.reason, reason), live(now)));
  }

  async take(tx: Executor, lotId: string, amount: number): Promise<number | null> {
    const rows = await tx
      .update(creditLot)
      .set({ remaining: sql`${creditLot.remaining} - ${amount}` })
      .where(and(eq(creditLot.id, lotId), sql`${creditLot.remaining} >= ${amount}`))
      .returning({ remaining: creditLot.remaining });
    return rows[0]?.remaining ?? null;
  }

  async give(tx: Executor, lotId: string, amount: number): Promise<number | null> {
    const rows = await tx
      .update(creditLot)
      .set({ remaining: sql`${creditLot.remaining} + ${amount}` })
      .where(and(eq(creditLot.id, lotId), sql`${creditLot.remaining} + ${amount} <= ${creditLot.amount}`))
      .returning({ remaining: creditLot.remaining });
    return rows[0]?.remaining ?? null;
  }

  async balances(executor: Executor, accountId: string, now: Date): Promise<{ vendorOrganizationId: string | null; serviceKeys: string[] | null; amount: number }[]> {
    return executor
      .select({ vendorOrganizationId: creditLot.vendorOrganizationId, serviceKeys: creditLot.serviceKeys, amount: sql<number>`sum(${creditLot.remaining})::int` })
      .from(creditLot)
      .where(and(eq(creditLot.accountId, accountId), live(now)))
      .groupBy(creditLot.vendorOrganizationId, creditLot.serviceKeys);
  }

  async listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<LotPage> {
    const where = eq(creditLot.accountId, accountId);
    const rows = await executor
      .select()
      .from(creditLot)
      .where(where)
      .orderBy(desc(creditLot.createdAt), desc(creditLot.id))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(creditLot).where(where);
    return { rows, total };
  }

  async vendorCredits(executor: Executor, vendorOrganizationId: string, now: Date): Promise<VendorCreditsTotals> {
    const own = eq(creditLot.vendorOrganizationId, vendorOrganizationId);
    const [{ issued }] = await executor.select({ issued: sql<number>`coalesce(sum(${creditLot.amount}), 0)::int` }).from(creditLot).where(own);
    const holders = await executor
      .select({
        organizationId: creditAccount.organizationId,
        userId: creditAccount.userId,
        remaining: sql<number>`sum(${creditLot.remaining})::int`,
        soonestExpiry: sql<Date | null>`min(${creditLot.expiresAt})`.mapWith(creditLot.expiresAt),
      })
      .from(creditLot)
      .innerJoin(creditAccount, eq(creditAccount.id, creditLot.accountId))
      .where(and(own, live(now)))
      .groupBy(creditAccount.id, creditAccount.organizationId, creditAccount.userId);
    return { issued, holders };
  }

  async listGrants(executor: Executor, page: { page: number; pageSize: number }): Promise<{ rows: GrantWithOwner[]; total: number }> {
    const where = eq(creditLot.reason, "admin_grant");
    const rows = await executor
      .select({ lot: creditLot, ownerOrganizationId: creditAccount.organizationId, ownerUserId: creditAccount.userId })
      .from(creditLot)
      .innerJoin(creditAccount, eq(creditAccount.id, creditLot.accountId))
      .where(where)
      .orderBy(desc(creditLot.createdAt), desc(creditLot.id))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(creditLot).where(where);
    return { rows: rows.map((r) => ({ ...r.lot, ownerOrganizationId: r.ownerOrganizationId, ownerUserId: r.ownerUserId })), total };
  }
}
