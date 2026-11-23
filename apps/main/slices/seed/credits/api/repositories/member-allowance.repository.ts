/**
 * Member allowance repository — data access for `member_allowance`: at most
 * one row per (account, member), and at most one rule for every member. No
 * logic: spent and remaining are the allowance service's to compute from the
 * ledger.
 */

import { and, eq, isNull } from "drizzle-orm";
import { memberAllowance, type MemberAllowanceSelect } from "../models/member-allowance.model";
import type { AllocationPeriod, UnspentMode } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface AllowanceRow {
  id: string;
  accountId: string;
  userId: string | null;
  organizationId: string;
  period: AllocationPeriod;
  unspent: UnspentMode;
  credits: number;
  serviceKeys: string[] | null;
  createsCredits: boolean;
  inherited: boolean;
  carried: number;
  countedFrom: Date;
  accruesFrom: Date;
  issuedUntil: Date | null;
}

export type AllowancePatch = Partial<Omit<AllowanceRow, "id" | "accountId" | "userId" | "organizationId">>;

export interface MemberAllowanceRepository {
  findByMember(executor: Executor, accountId: string, userId: string): Promise<MemberAllowanceSelect | null>;
  /** The rule for every member without one of their own. */
  findDefault(executor: Executor, accountId: string): Promise<MemberAllowanceSelect | null>;
  listForAccount(executor: Executor, accountId: string): Promise<MemberAllowanceSelect[]>;
  insert(executor: Executor, row: AllowanceRow): Promise<MemberAllowanceSelect>;
  patch(executor: Executor, id: string, patch: AllowancePatch): Promise<MemberAllowanceSelect>;
  remove(executor: Executor, id: string): Promise<boolean>;
  /** The rows of the members following the rule for every member. */
  removeInherited(executor: Executor, accountId: string): Promise<void>;
}

export class DrizzleMemberAllowanceRepository implements MemberAllowanceRepository {
  async findByMember(executor: Executor, accountId: string, userId: string): Promise<MemberAllowanceSelect | null> {
    const rows = await executor
      .select()
      .from(memberAllowance)
      .where(and(eq(memberAllowance.accountId, accountId), eq(memberAllowance.userId, userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findDefault(executor: Executor, accountId: string): Promise<MemberAllowanceSelect | null> {
    const rows = await executor
      .select()
      .from(memberAllowance)
      .where(and(eq(memberAllowance.accountId, accountId), isNull(memberAllowance.userId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async listForAccount(executor: Executor, accountId: string): Promise<MemberAllowanceSelect[]> {
    return executor.select().from(memberAllowance).where(eq(memberAllowance.accountId, accountId));
  }

  async insert(executor: Executor, row: AllowanceRow): Promise<MemberAllowanceSelect> {
    const now = new Date();
    const rows = await executor
      .insert(memberAllowance)
      .values({ ...row, createdAt: now, updatedAt: now })
      .returning();
    return rows[0];
  }

  async patch(executor: Executor, id: string, patch: AllowancePatch): Promise<MemberAllowanceSelect> {
    const rows = await executor
      .update(memberAllowance)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(memberAllowance.id, id))
      .returning();
    return rows[0];
  }

  async remove(executor: Executor, id: string): Promise<boolean> {
    const rows = await executor.delete(memberAllowance).where(eq(memberAllowance.id, id)).returning({ id: memberAllowance.id });
    return rows.length > 0;
  }

  async removeInherited(executor: Executor, accountId: string): Promise<void> {
    await executor.delete(memberAllowance).where(and(eq(memberAllowance.accountId, accountId), eq(memberAllowance.inherited, true)));
  }
}
