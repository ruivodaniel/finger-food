/**
 * Allowance service — what an organization lets one member spend, renewing
 * each calendar period (UTC, weeks from Monday). The rule is a row; what the
 * member spent is the sum of their service charge and refund rows, read from
 * the ledger at every question. Purchases never count. Nothing is counted, so
 * nothing can drift or need a reset.
 *
 *   replace  the amount, minus what was spent this period
 *   top up   the amount for every period since the rule began, minus what was
 *            spent since
 *
 * A rule either draws on what the organization holds, or creates each period's
 * credits on it. This service says what is due; the ledger creates it.
 */

import type { Allowance, AllocationPeriod, AllowanceInput } from "../../shared/types";
import type { MemberAllowanceSelect } from "../models/member-allowance.model";
import type { CreditLedgerRepository } from "../repositories/credit-ledger.repository";
import type { AllowancePatch, MemberAllowanceRepository } from "../repositories/member-allowance.repository";
import type { Executor } from "../shared/executor";

const DAY_MS = 86_400_000;

/** The UTC start of the calendar period `now` falls in. */
export function periodStart(period: AllocationPeriod, now: Date): Date {
  const y = now.getUTCFullYear(), m = now.getUTCMonth(), d = now.getUTCDate();
  if (period === "month") return new Date(Date.UTC(y, m, 1));
  if (period === "day") return new Date(Date.UTC(y, m, d));
  const dow = (now.getUTCDay() + 6) % 7; // Monday = 0
  return new Date(Date.UTC(y, m, d - dow));
}

/** The period start `count` periods after `start`. */
export function advance(period: AllocationPeriod, start: Date, count = 1): Date {
  if (period === "month") return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + count, 1));
  return new Date(start.getTime() + count * (period === "week" ? 7 : 1) * DAY_MS);
}

/** How many period starts lie between `from` (itself a period start) and `now`, both ends counted. */
export function periodsSince(period: AllocationPeriod, from: Date, now: Date): number {
  if (from > now) return 0;
  if (period === "month") return (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + now.getUTCMonth() - from.getUTCMonth() + 1;
  return Math.floor((now.getTime() - from.getTime()) / ((period === "week" ? 7 : 1) * DAY_MS)) + 1;
}

/** Credits a creating rule owes the organization now. */
export interface DueLot {
  amount: number;
  expiresAt: Date | null;
  sourceRef: string;
  /** what the rule's `issued_until` becomes once they exist */
  issuedUntil: Date;
}

export interface AllowanceServiceDeps {
  allowanceRepo: MemberAllowanceRepository;
  ledgerRepo: CreditLedgerRepository;
  createId: () => string;
}

export class AllowanceService {
  private readonly deps: AllowanceServiceDeps;

  constructor(deps: AllowanceServiceDeps) {
    this.deps = deps;
  }

  /** The rule as the member sees it now. `userId` names the member a rule for everyone is being read for. */
  async allowanceOf(executor: Executor, row: MemberAllowanceSelect, userId: string | null = row.userId): Promise<Allowance> {
    const now = new Date();
    const start = periodStart(row.period, now);
    const topUp = row.unspent === "top_up";
    const spent = userId == null ? 0 : await this.deps.ledgerRepo.spentByMemberSince(executor, row.accountId, userId, topUp ? row.countedFrom : start);
    const granted = topUp ? row.carried + row.credits * periodsSince(row.period, row.accruesFrom, now) : row.credits;
    return {
      userId, inherited: row.inherited, period: row.period, unspent: row.unspent, credits: row.credits, services: row.serviceKeys,
      createsCredits: row.createsCredits, spent, remaining: Math.max(0, granted - spent), renewsAt: advance(row.period, start).toISOString(),
    };
  }

  /** A member's rule as it stands, without writing anything; null when no rule applies to them. */
  async forMember(executor: Executor, accountId: string, userId: string): Promise<Allowance | null> {
    const own = await this.deps.allowanceRepo.findByMember(executor, accountId, userId);
    if (own) return this.allowanceOf(executor, own);
    const everyone = await this.deps.allowanceRepo.findDefault(executor, accountId);
    if (!everyone) return null;
    const start = periodStart(everyone.period, new Date());
    return { ...(await this.allowanceOf(executor, { ...everyone, inherited: true, carried: 0, countedFrom: start, accruesFrom: start }, userId)) };
  }

  /** A member's rule, giving them their own row when they first come under the rule for every member. Under the account lock. */
  async memberRule(tx: Executor, accountId: string, userId: string): Promise<MemberAllowanceSelect | null> {
    const own = await this.deps.allowanceRepo.findByMember(tx, accountId, userId);
    if (own) return own;
    const everyone = await this.deps.allowanceRepo.findDefault(tx, accountId);
    if (!everyone) return null;
    const start = periodStart(everyone.period, new Date());
    return this.deps.allowanceRepo.insert(tx, {
      id: this.deps.createId(), accountId, userId, organizationId: everyone.organizationId, period: everyone.period, unspent: everyone.unspent,
      credits: everyone.credits, serviceKeys: everyone.serviceKeys, createsCredits: everyone.createsCredits, inherited: true, carried: 0,
      countedFrom: start, accruesFrom: start, issuedUntil: null,
    });
  }

  /** What a creating rule owes now, or null. Replace owes this period; top up owes every period since it last paid. */
  dueLot(rule: MemberAllowanceSelect): DueLot | null {
    if (!rule.createsCredits || rule.userId == null) return null;
    const now = new Date();
    const start = periodStart(rule.period, now);
    if (rule.unspent === "replace") {
      if (rule.issuedUntil && rule.issuedUntil > start) return null;
      const end = advance(rule.period, start);
      return { amount: rule.credits, expiresAt: end, sourceRef: `allocation:${rule.id}:${start.toISOString()}`, issuedUntil: end };
    }
    const from = rule.issuedUntil ?? rule.accruesFrom;
    const periods = periodsSince(rule.period, from, now);
    if (periods <= 0) return null;
    return { amount: rule.credits * periods, expiresAt: null, sourceRef: `allocation:${rule.id}:${from.toISOString()}`, issuedUntil: advance(rule.period, from, periods) };
  }

  async markIssued(tx: Executor, ruleId: string, issuedUntil: Date): Promise<void> {
    await this.deps.allowanceRepo.patch(tx, ruleId, { issuedUntil });
  }

  /** The rules that may owe credits now. */
  async issuable(tx: Executor, accountId: string): Promise<MemberAllowanceSelect[]> {
    return (await this.deps.allowanceRepo.listForAccount(tx, accountId)).filter((row) => row.createsCredits && row.userId != null);
  }

  async list(executor: Executor, accountId: string): Promise<Allowance[]> {
    const rows = await this.deps.allowanceRepo.listForAccount(executor, accountId);
    const out: Allowance[] = [];
    for (const row of rows) out.push(await this.allowanceOf(executor, row));
    return out;
  }

  /**
   * Saves a member's rule, or the rule for every member along with those
   * following it. Under the account lock, with what was due already created.
   * `raises` are the extra credits a raised replace rule owes this period.
   */
  async set(tx: Executor, input: { accountId: string; organizationId: string; userId: string | null; rule: AllowanceInput }): Promise<{ allowance: Allowance; raises: DueLot[] }> {
    const { accountId, organizationId, userId, rule } = input;
    const { allowanceRepo } = this.deps;
    const existing = userId == null ? await allowanceRepo.findDefault(tx, accountId) : await allowanceRepo.findByMember(tx, accountId, userId);
    const raises: DueLot[] = [];
    let saved: MemberAllowanceSelect;
    if (!existing) {
      const start = periodStart(rule.period, new Date());
      saved = await allowanceRepo.insert(tx, {
        id: this.deps.createId(), accountId, userId, organizationId, period: rule.period, unspent: rule.unspent, credits: rule.credits, serviceKeys: rule.services,
        createsCredits: rule.createsCredits, inherited: false, carried: 0, countedFrom: start, accruesFrom: start, issuedUntil: null,
      });
    } else {
      const change = await this.changeOf(tx, existing, rule);
      if (change.raise) raises.push(change.raise);
      saved = await allowanceRepo.patch(tx, existing.id, { ...change.patch, inherited: false });
    }
    if (userId == null) {
      for (const follower of (await allowanceRepo.listForAccount(tx, accountId)).filter((row) => row.inherited)) {
        const change = await this.changeOf(tx, follower, rule);
        if (change.raise) raises.push(change.raise);
        await allowanceRepo.patch(tx, follower.id, change.patch);
      }
    }
    return { allowance: await this.allowanceOf(tx, saved), raises };
  }

  /**
   * What saving `rule` over `row` changes. Another period, mode or source of
   * credits starts fresh. A new top-up amount keeps what the member had left
   * and counts from the next period. A new replace amount holds at once, and
   * a raise on a creating rule owes the difference for this period.
   */
  private async changeOf(tx: Executor, row: MemberAllowanceSelect, rule: AllowanceInput): Promise<{ patch: AllowancePatch; raise: DueLot | null }> {
    const now = new Date();
    const start = periodStart(rule.period, now);
    const same = { period: rule.period, unspent: rule.unspent, credits: rule.credits, serviceKeys: rule.services, createsCredits: rule.createsCredits };
    if (row.period !== rule.period || row.unspent !== rule.unspent || row.createsCredits !== rule.createsCredits) {
      return { patch: { ...same, carried: 0, countedFrom: start, accruesFrom: start, issuedUntil: null }, raise: null };
    }
    if (row.credits === rule.credits) return { patch: same, raise: null };
    if (rule.unspent === "top_up") {
      const { remaining } = await this.allowanceOf(tx, row);
      return { patch: { ...same, carried: remaining, countedFrom: now, accruesFrom: advance(rule.period, start) }, raise: null };
    }
    const issuedThisPeriod = row.createsCredits && row.userId != null && row.issuedUntil != null && row.issuedUntil > start;
    if (!issuedThisPeriod || rule.credits <= row.credits) return { patch: same, raise: null };
    return {
      patch: same,
      raise: { amount: rule.credits - row.credits, expiresAt: row.issuedUntil, sourceRef: `allocation:${row.id}:${start.toISOString()}:raise:${rule.credits}`, issuedUntil: row.issuedUntil as Date },
    };
  }

  /** Removes a member's own rule, or the rule for every member and those following it. */
  async clear(tx: Executor, accountId: string, userId: string | null): Promise<boolean> {
    const { allowanceRepo } = this.deps;
    const row = userId == null ? await allowanceRepo.findDefault(tx, accountId) : await allowanceRepo.findByMember(tx, accountId, userId);
    if (!row) return false;
    if (userId == null) await allowanceRepo.removeInherited(tx, accountId);
    return allowanceRepo.remove(tx, row.id);
  }
}
