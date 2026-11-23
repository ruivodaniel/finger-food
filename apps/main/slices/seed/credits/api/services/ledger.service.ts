/**
 * Ledger service — ALL credit movements, one transaction each, never a
 * read-modify-save. Credits live in lots; this is the only code that grants,
 * draws, returns or writes them off.
 *
 *   charge    the consumer's debit before a metered action runs. The owner's
 *             price list must include the service, else the refusal is
 *             `entitlement` and nothing moves; the cost is units times its
 *             price. Then, under the account lock: an organization member's
 *             allocation against the ledger, and the draw across the live
 *             platform lots that can pay for the service by priority, then
 *             lots limited to some services before general ones, then soonest
 *             expiry, then age, one charge row per lot touched. A reference
 *             seen before is already charged. Vendor lots are never drawn here.
 *   refund    the reversal of a reference's service charge rows, each into the
 *             lot it came from, when the action failed or was undone. Once per
 *             reference.
 *   grant     a new lot and its grant row; the lot's indexes make a repeated
 *             source (a redelivered event, a re-emitted welcome hook) a no-op.
 *   takeBack  what is left of a lot whose payment was refunded, up to a limit:
 *             never below zero, whatever was already spent stays spent.
 *   end       the live lots of one reason expire now (the plan lot, when the
 *             plan changes or ends).
 *   settle    lazy expiry: a balance never counts an expired lot, read or not;
 *             the first touch after an expiry writes one expire row for what
 *             was left, so the history tells the truth without a scheduler.
 *             Credits a member's rule creates arrive the same way.
 *
 * These write without an access context by design (a consumer's bookkeeping, a
 * webhook, a lifecycle hook); the routes above them are the gated surface.
 */

import { unitPrice, type CreditsCatalog } from "../../shared/catalog";
import { LOT_PRIORITY, type CreditOwner, type LotReason } from "../../shared/types";
import type { CreditAccountSelect } from "../models/credit-account.model";
import type { CreditLotSelect } from "../models/credit-lot.model";
import type { MemberAllowanceSelect } from "../models/member-allowance.model";
import type { CreditAccountRepository } from "../repositories/credit-account.repository";
import type { CreditLedgerRepository } from "../repositories/credit-ledger.repository";
import type { CreditLotRepository, VendorCreditsTotals } from "../repositories/credit-lot.repository";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleLogger } from "../shared/module-errors";
import type { AllowanceService } from "./allowance.service";

export type ChargeResult =
  | { ok: true; accountId: string; cost: number; balance: number; alreadyCharged: boolean }
  | { ok: false; reason: "entitlement"; accountId: string; service: string }
  | { ok: false; reason: "balance"; accountId: string; balance: number; cost: number }
  | { ok: false; reason: "allowance"; accountId: string; balance: number; cost: number; remaining: number };

/** What an action on a service would cost the owner, asked before it starts. */
export type Quote = { ok: true; unitPrice: number; cost: number } | { ok: false; reason: "entitlement" };

export interface Balances {
  /** the live platform lots that pay for everything */
  platform: number;
  /** the live platform lots that pay only for these services, per list */
  limited: { services: string[]; amount: number }[];
  /** the live lots at each vendor */
  vendors: { vendorOrganizationId: string; amount: number }[];
}

export interface GrantInput {
  owner: CreditOwner;
  reason: LotReason;
  amount: number;
  expiresAt?: Date | null;
  /** set for vendor credits */
  vendorOrganizationId?: string | null;
  /** the services it can pay for; null or absent is every service */
  serviceKeys?: string[] | null;
  /** defaults to the reason's priority */
  priority?: number;
  sourceRef?: string | null;
  issuedByUserId?: string | null;
  /** why it was given, in the issuer's words */
  note?: string | null;
  /** the grant row's reference (the purchase a refund lot settles) */
  ref?: string | null;
  sourceEventId?: string | null;
}

export interface LedgerServiceDeps {
  accountRepo: CreditAccountRepository;
  lotRepo: CreditLotRepository;
  ledgerRepo: CreditLedgerRepository;
  allowances: Pick<AllowanceService, "memberRule" | "allowanceOf" | "dueLot" | "markIssued" | "issuable">;
  catalog: Pick<CreditsCatalog, "currency" | "defaultPriceList" | "priceLists">;
  /** single statements outside a transaction (a quote) */
  db: Executor;
  runInTransaction: RunInTransaction;
  createId: () => string;
  logger: ModuleLogger;
}

export class LedgerService {
  private readonly deps: LedgerServiceDeps;

  constructor(deps: LedgerServiceDeps) {
    this.deps = deps;
  }

  /** The platform currency: credits are cents of it. */
  get currency(): string {
    return this.deps.catalog.currency;
  }

  private async accountFor(executor: Executor, owner: CreditOwner): Promise<CreditAccountSelect> {
    return (await this.deps.accountRepo.findByOwner(executor, owner)) ?? this.deps.accountRepo.ensure(executor, this.deps.createId(), owner);
  }

  /** The cost of `units` of a service under the owner's price list, or the entitlement refusal. */
  async quote(owner: CreditOwner, input: { service: string; units: number }): Promise<Quote> {
    const account = await this.deps.accountRepo.findByOwner(this.deps.db, owner);
    const price = unitPrice(this.deps.catalog, account?.priceList ?? null, input.service);
    return price == null ? { ok: false, reason: "entitlement" } : { ok: true, unitPrice: price, cost: price * input.units };
  }

  async charge(owner: CreditOwner, input: { service: string; units: number; ref: string; userId: string }): Promise<ChargeResult> {
    if (!Number.isInteger(input.units) || input.units < 1) throw new Error("units must be a positive integer");
    const { accountRepo, lotRepo, ledgerRepo } = this.deps;
    return this.deps.runInTransaction(async (tx) => {
      const found = await this.accountFor(tx, owner);
      const account = (await accountRepo.lockForUpdate(tx, found.id)) ?? found;
      const accountId = account.id;
      const now = new Date();

      // the same reference twice is the same charge — answer as done
      const prior = await ledgerRepo.findByRef(tx, input.ref, "charge");
      if (prior.length) {
        const cost = prior.reduce((sum, row) => sum - row.delta, 0);
        return { ok: true, accountId, cost, balance: await this.platformBalance(tx, accountId, now, input.service), alreadyCharged: true };
      }

      // the price list decides whether the service may run and what one unit costs
      const price = unitPrice(this.deps.catalog, account.priceList, input.service);
      if (price == null) return { ok: false, reason: "entitlement", accountId, service: input.service };
      const cost = price * input.units;

      // an organization may allocate what a member spends; personal credits have no rules
      const rule = owner.organizationId != null ? await this.deps.allowances.memberRule(tx, accountId, input.userId) : null;
      if (rule) await this.issueRule(tx, owner, rule);

      await this.writeOffExpired(tx, accountId, now);
      const lots = await lotRepo.spendable(tx, accountId, null, now, input.service);
      const balance = lots.reduce((sum, lot) => sum + lot.remaining, 0);

      if (rule) {
        const allowance = await this.deps.allowances.allowanceOf(tx, rule);
        if (allowance.services && !allowance.services.includes(input.service)) return { ok: false, reason: "allowance", accountId, balance, cost, remaining: 0 };
        if (cost > allowance.remaining) return { ok: false, reason: "allowance", accountId, balance, cost, remaining: allowance.remaining };
      }
      if (cost === 0) return { ok: true, accountId, cost, balance, alreadyCharged: false };
      if (cost > balance) return { ok: false, reason: "balance", accountId, balance, cost };

      // draw in spend order — the lots arrive sorted
      let left = cost;
      for (const lot of lots) {
        if (left === 0) break;
        const part = Math.min(lot.remaining, left);
        const after = await lotRepo.take(tx, lot.id, part);
        if (after === null) throw new Error(`credit lot ${lot.id} moved under the account lock`);
        await ledgerRepo.append(tx, {
          id: this.deps.createId(), accountId, lotId: lot.id, reason: "charge", delta: -part, lotRemainingAfter: after,
          serviceKey: input.service, userId: input.userId, ref: input.ref,
        });
        left -= part;
      }
      return { ok: true, accountId, cost, balance: balance - cost, alreadyCharged: false };
    });
  }

  /** Reverses the reference's service charges into their lots. False when nothing was charged, or it was refunded before. */
  async refund(input: { ref: string }): Promise<{ refunded: boolean; balance?: number }> {
    const { accountRepo, lotRepo, ledgerRepo } = this.deps;
    return this.deps.runInTransaction(async (tx) => {
      // a purchase is settled by its vendor, never by this — only service charges come back here
      const charges = (await ledgerRepo.findByRef(tx, input.ref, "charge")).filter((row) => row.serviceKey != null);
      if (!charges.length) return { refunded: false };
      const accountId = charges[0].accountId;
      const service = charges[0].serviceKey as string;
      if (!(await accountRepo.lockForUpdate(tx, accountId))) return { refunded: false };
      const now = new Date();
      if ((await ledgerRepo.findByRef(tx, input.ref, "refund")).length) return { refunded: false, balance: await this.platformBalance(tx, accountId, now, service) };

      for (const c of charges) {
        const after = await lotRepo.give(tx, c.lotId, -c.delta);
        if (after === null) throw new Error(`credit lot ${c.lotId} cannot take back ${-c.delta}`);
        await ledgerRepo.append(tx, {
          id: this.deps.createId(), accountId, lotId: c.lotId, reason: "refund", delta: -c.delta, lotRemainingAfter: after,
          serviceKey: c.serviceKey, userId: c.userId, ref: input.ref,
        });
      }
      // credits given back to a lot that has since expired are lost at once, on the record
      await this.writeOffExpired(tx, accountId, now);
      return { refunded: true, balance: await this.platformBalance(tx, accountId, now, service) };
    });
  }

  /** A new lot and its grant row. Null when the lot's source (or the welcome once) was granted before. */
  async grant(tx: Executor, input: GrantInput): Promise<CreditLotSelect | null> {
    if (!Number.isInteger(input.amount) || input.amount <= 0) return null;
    const account = await this.accountFor(tx, input.owner);
    const lot = await this.deps.lotRepo.insert(tx, {
      id: this.deps.createId(),
      accountId: account.id,
      vendorOrganizationId: input.vendorOrganizationId ?? null,
      serviceKeys: input.serviceKeys ? [...input.serviceKeys].sort() : null,
      reason: input.reason,
      priority: input.priority ?? LOT_PRIORITY[input.reason],
      amount: input.amount,
      expiresAt: input.expiresAt ?? null,
      sourceRef: input.sourceRef ?? null,
      issuedByUserId: input.issuedByUserId ?? null,
      note: input.note ?? null,
    });
    if (!lot) return null;
    await this.deps.ledgerRepo.append(tx, {
      id: this.deps.createId(), accountId: account.id, lotId: lot.id, reason: "grant", delta: input.amount,
      lotRemainingAfter: input.amount, ref: input.ref ?? null, sourceEventId: input.sourceEventId ?? null,
    });
    return lot;
  }

  /**
   * Takes what is left of a source's lot, up to `upTo`: the payment behind the
   * lot was refunded. Never below zero: what was spent stays spent. Keyed by
   * the event, so a repeat writes nothing. The amount taken.
   */
  async takeBack(tx: Executor, owner: CreditOwner, input: { sourceRef: string; upTo: number; sourceEventId: string }): Promise<number> {
    const { accountRepo, lotRepo, ledgerRepo } = this.deps;
    const account = await accountRepo.findByOwner(tx, owner);
    if (!account || !(await accountRepo.lockForUpdate(tx, account.id))) return 0;
    await this.writeOffExpired(tx, account.id, new Date());
    const lot = await lotRepo.findBySource(tx, input.sourceRef);
    if (!lot || lot.accountId !== account.id) return 0;
    const part = Math.min(lot.remaining, input.upTo);
    if (part <= 0) return 0;
    if ((await ledgerRepo.findByRef(tx, input.sourceEventId, "take_back")).some((row) => row.lotId === lot.id)) return 0;
    const after = await lotRepo.take(tx, lot.id, part);
    if (after === null) throw new Error(`credit lot ${lot.id} moved under the account lock`);
    await ledgerRepo.append(tx, {
      id: this.deps.createId(), accountId: account.id, lotId: lot.id, reason: "take_back", delta: -part, lotRemainingAfter: after,
      ref: input.sourceEventId, sourceEventId: input.sourceEventId,
    });
    return part;
  }

  /**
   * A purchase paid with the credits the buyer holds at the vendor: the price
   * drawn across the buyer's live lots at that vendor, by priority then
   * expiry, one charge row per lot, the purchase as reference. All or
   * nothing: when the lots fall short, nothing moves. Inside the purchase's
   * transaction; takes the account lock.
   */
  async chargeVendor(
    tx: Executor,
    input: { owner: CreditOwner; vendorOrganizationId: string; amount: number; purchaseId: string; userId: string },
  ): Promise<{ ok: true } | { ok: false; balance: number }> {
    const { accountRepo, lotRepo, ledgerRepo } = this.deps;
    const accountId = (await this.accountFor(tx, input.owner)).id;
    if (!(await accountRepo.lockForUpdate(tx, accountId))) return { ok: false, balance: 0 };
    const now = new Date();
    await this.writeOffExpired(tx, accountId, now);
    const lots = await lotRepo.spendable(tx, accountId, input.vendorOrganizationId, now);
    const balance = lots.reduce((sum, lot) => sum + lot.remaining, 0);
    if (input.amount > balance) return { ok: false, balance };
    let left = input.amount;
    for (const lot of lots) {
      if (left === 0) break;
      const part = Math.min(lot.remaining, left);
      const after = await lotRepo.take(tx, lot.id, part);
      if (after === null) throw new Error(`credit lot ${lot.id} moved under the account lock`);
      await ledgerRepo.append(tx, {
        id: this.deps.createId(), accountId, lotId: lot.id, reason: "charge", delta: -part, lotRemainingAfter: after,
        userId: input.userId, ref: input.purchaseId,
      });
      left -= part;
    }
    return { ok: true };
  }

  /** What the owner holds at one vendor, live. */
  async vendorBalance(executor: Executor, owner: CreditOwner, vendorOrganizationId: string): Promise<number> {
    const account = await this.deps.accountRepo.findByOwner(executor, owner);
    if (!account) return 0;
    return (await this.deps.lotRepo.spendable(executor, account.id, vendorOrganizationId, new Date())).reduce((sum, lot) => sum + lot.remaining, 0);
  }

  /** What a vendor has issued in its own credits, and who still holds some. */
  async issuedBy(executor: Executor, vendorOrganizationId: string): Promise<VendorCreditsTotals> {
    return this.deps.lotRepo.vendorCredits(executor, vendorOrganizationId, new Date());
  }

  /** The live lots of one reason expire now: one expire row each for what was left. */
  async endLots(tx: Executor, owner: CreditOwner, reason: LotReason, meta: { sourceEventId?: string } = {}): Promise<void> {
    const account = await this.deps.accountRepo.findByOwner(tx, owner);
    if (!account || !(await this.deps.accountRepo.lockForUpdate(tx, account.id))) return;
    for (const lot of await this.deps.lotRepo.liveByReason(tx, account.id, reason, new Date())) await this.expire(tx, lot, meta.sourceEventId);
  }

  /** Whether the catalog has this price list — what an app checks its plans against at boot. */
  hasPriceList(key: string): boolean {
    return this.deps.catalog.priceLists[key] != null;
  }

  /** Assigns the price list the owner pays by; null goes back to the default. */
  async setPriceList(tx: Executor, owner: CreditOwner, key: string | null): Promise<void> {
    const account = await this.accountFor(tx, owner);
    await this.deps.accountRepo.setPriceList(tx, account.id, key);
  }

  /** Creates what the organization's rules owe now. Under the account lock. */
  async issueDue(tx: Executor, owner: CreditOwner, accountId: string): Promise<void> {
    for (const rule of await this.deps.allowances.issuable(tx, accountId)) await this.issueRule(tx, owner, rule);
  }

  /** A member looks at their allocation: they come under the rule for every member, and what it owes is created. */
  async touchMember(owner: { organizationId: string }, userId: string): Promise<void> {
    await this.deps.runInTransaction(async (tx) => {
      const account = await this.accountFor(tx, owner);
      await this.deps.accountRepo.lockForUpdate(tx, account.id);
      const rule = await this.deps.allowances.memberRule(tx, account.id, userId);
      if (rule) await this.issueRule(tx, owner, rule);
    });
  }

  /** The lazy expiry and the rules' credits, for a reader: bring the account up to now. */
  async settle(accountId: string): Promise<void> {
    await this.deps.runInTransaction(async (tx) => {
      const account = await this.deps.accountRepo.lockForUpdate(tx, accountId);
      if (!account) return;
      if (account.organizationId != null) await this.issueDue(tx, { organizationId: account.organizationId }, accountId);
      await this.writeOffExpired(tx, accountId, new Date());
    });
  }

  async balances(executor: Executor, accountId: string): Promise<Balances> {
    const rows = await this.deps.lotRepo.balances(executor, accountId, new Date());
    return {
      platform: rows.find((r) => r.vendorOrganizationId == null && r.serviceKeys == null)?.amount ?? 0,
      limited: rows.flatMap((r) => (r.vendorOrganizationId == null && r.serviceKeys != null && r.amount > 0 ? [{ services: r.serviceKeys, amount: r.amount }] : [])),
      vendors: rows.flatMap((r) => (r.vendorOrganizationId != null && r.amount > 0 ? [{ vendorOrganizationId: r.vendorOrganizationId, amount: r.amount }] : [])),
    };
  }

  // ── inside a transaction that holds the account lock ──────────────────────

  private async issueRule(tx: Executor, owner: CreditOwner, rule: MemberAllowanceSelect): Promise<void> {
    const due = this.deps.allowances.dueLot(rule);
    if (!due) return;
    await this.grant(tx, { owner, reason: "allocation", amount: due.amount, expiresAt: due.expiresAt, sourceRef: due.sourceRef });
    await this.deps.allowances.markIssued(tx, rule.id, due.issuedUntil);
  }

  private async writeOffExpired(tx: Executor, accountId: string, now: Date): Promise<void> {
    for (const lot of await this.deps.lotRepo.expiredWithRemaining(tx, accountId, now)) await this.expire(tx, lot);
  }

  private async expire(tx: Executor, lot: CreditLotSelect, sourceEventId?: string): Promise<void> {
    const after = await this.deps.lotRepo.take(tx, lot.id, lot.remaining);
    if (after === null) throw new Error(`credit lot ${lot.id} moved under the account lock`);
    await this.deps.ledgerRepo.append(tx, {
      id: this.deps.createId(), accountId: lot.accountId, lotId: lot.id, reason: "expire", delta: -lot.remaining,
      lotRemainingAfter: after, sourceEventId: sourceEventId ?? null,
    });
  }

  private async platformBalance(tx: Executor, accountId: string, now: Date, service: string): Promise<number> {
    return (await this.deps.lotRepo.spendable(tx, accountId, null, now, service)).reduce((sum, lot) => sum + lot.remaining, 0);
  }
}
