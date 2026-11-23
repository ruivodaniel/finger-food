/**
 * Credit account service — the credit owner's row, and everything a signed-in
 * caller may ask about it.
 *
 * Ungated (the named exceptions): `ensure` creates the row lazily from the
 * session's own identity; `welcome*` grant the once-only welcome lot from the
 * lifecycle hooks.
 *
 * Gated (the HTTP surface): the owner a scope names comes from the session
 * only — never from the URL or the body — and the row is read through the
 * access-control engine: the caller's read scope admits it, or they cannot
 * see it. `requireManageable` adds the update verdict; it is what the
 * allowance writes stand on. Lots, the ledger and the allowances are children
 * of the account: proven on the parent, then read by `account_id`. Every read
 * settles the account first, so what it shows is on the record.
 *
 * A rule that creates credits stands on a permission of its own, the engine's
 * create verdict on `member_allowance` in the caller's active organization:
 * which organization types and roles hold it is the access-control config's.
 */

import type { Ac, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { CreditsCatalog } from "../../shared/catalog";
import type { Allowance, CreditOwner, CreditScope, CreditsSummary, LedgerEntry, LotView } from "../../shared/types";
import type { CreditAccountSelect } from "../models/credit-account.model";
import type { CreditLotSelect } from "../models/credit-lot.model";
import type { AllowanceUpsert } from "../models/credits.schemas";
import type { CreditAccountRepository } from "../repositories/credit-account.repository";
import type { CreditLedgerRepository, LedgerRowWithLot } from "../repositories/credit-ledger.repository";
import type { CreditLotRepository } from "../repositories/credit-lot.repository";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors } from "../shared/module-errors";
import { lookUpNames, type People } from "../shared/owner-names";
import type { AllowanceService } from "./allowance.service";
import type { LedgerService } from "./ledger.service";

const DAY_MS = 86_400_000;

export interface CreditAccountServiceDeps {
  accountRepo: CreditAccountRepository;
  lotRepo: Pick<CreditLotRepository, "listForAccount">;
  ledgerRepo: Pick<CreditLedgerRepository, "listForAccount">;
  ledger: Pick<LedgerService, "grant" | "settle" | "balances" | "issueDue" | "touchMember">;
  allowances: Pick<AllowanceService, "forMember" | "list" | "set" | "clear">;
  catalog: Pick<CreditsCatalog, "welcome" | "currency" | "services">;
  engine: Pick<Ac, "resolveRead" | "allowUpdate" | "allowCreate">;
  /** single statements outside a transaction (reads after the parent was proven) */
  db: Executor;
  runInTransaction: RunInTransaction;
  createId: () => string;
  errors: ModuleErrors;
  /** names the vendors on the summary */
  people: People;
}

export const toLotView = (row: CreditLotSelect, now: Date): LotView => ({
  id: row.id,
  reason: row.reason,
  vendorOrganizationId: row.vendorOrganizationId,
  services: row.serviceKeys,
  priority: row.priority,
  amount: row.amount,
  remaining: row.remaining,
  expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  expired: row.expiresAt != null && row.expiresAt <= now,
  createdAt: row.createdAt.toISOString(),
});

export const toLedgerEntry = (row: LedgerRowWithLot): LedgerEntry => ({
  id: row.id,
  lotId: row.lotId,
  lotReason: row.lotReason,
  reason: row.reason,
  delta: row.delta,
  lotRemainingAfter: row.lotRemainingAfter,
  serviceKey: row.serviceKey,
  userId: row.userId,
  ref: row.ref,
  createdAt: row.createdAt.toISOString(),
});

const ownsRow = (row: CreditAccountSelect, owner: CreditOwner) =>
  owner.organizationId != null ? row.organizationId === owner.organizationId : row.userId === owner.userId;

export class CreditAccountService {
  private readonly deps: CreditAccountServiceDeps;

  constructor(deps: CreditAccountServiceDeps) {
    this.deps = deps;
  }

  // ── ungated ───────────────────────────────────────────────────────────────

  async ensure(executor: Executor, owner: CreditOwner): Promise<CreditAccountSelect> {
    return (await this.deps.accountRepo.findByOwner(executor, owner)) ?? this.deps.accountRepo.ensure(executor, this.deps.createId(), owner);
  }

  /** Welcome credits for a new person — once; a re-emitted hook changes nothing. */
  async welcomeUser(userId: string): Promise<boolean> {
    return this.welcome({ userId }, this.deps.catalog.welcome.user);
  }

  /** Welcome credits for a new organization — once. */
  async welcomeOrganization(organizationId: string): Promise<boolean> {
    return this.welcome({ organizationId }, this.deps.catalog.welcome.organization);
  }

  private welcome(owner: CreditOwner, amount: number): Promise<boolean> {
    const days = this.deps.catalog.welcome.expiresInDays;
    const expiresAt = days == null ? null : new Date(Date.now() + days * DAY_MS);
    return this.deps.runInTransaction(async (tx) => (await this.deps.ledger.grant(tx, { owner, reason: "welcome", amount, expiresAt })) != null);
  }

  // ── gated ─────────────────────────────────────────────────────────────────

  /** The credit owner a scope names: the caller, or the caller's active organization. */
  ownerFor(ac: ScopedAcRequestContext, scope: CreditScope): CreditOwner {
    if (scope === "account") return { userId: ac.bag.session.user.id };
    const organization = ac.bag.session.organization;
    if (!organization) throw this.deps.errors.badRequest("no active organization");
    return { organizationId: organization.id };
  }

  /** The owner's row as the caller's read scope admits it — forbidden when it admits nothing. */
  private async visible(ac: ScopedAcRequestContext, scope: CreditScope): Promise<{ account: CreditAccountSelect; owner: CreditOwner }> {
    const owner = this.ownerFor(ac, scope);
    await this.ensure(this.deps.db, owner);
    const readScope = this.deps.engine.resolveRead(ac.permissions, "credit_account", ac.bag);
    const rows = (await ac.gateDb.read("credit_account", readScope).rows()) as CreditAccountSelect[];
    const account = rows.find((row) => ownsRow(row, owner));
    if (!account) throw this.deps.errors.forbidden("you cannot see these credits");
    return { account, owner };
  }

  /** Visible, with the expired lots written off — what every read shows. */
  private async settled(ac: ScopedAcRequestContext, scope: CreditScope): Promise<CreditAccountSelect> {
    const { account } = await this.visible(ac, scope);
    await this.deps.ledger.settle(account.id);
    return account;
  }

  /** The row plus the update verdict — what every write on the account stands on. */
  async requireManageable(ac: ScopedAcRequestContext, scope: CreditScope): Promise<{ account: CreditAccountSelect; owner: CreditOwner }> {
    const seen = await this.visible(ac, scope);
    const verdict = this.deps.engine.allowUpdate(ac.permissions, "credit_account", {}, ac.bag);
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "you cannot manage these credits");
    return seen;
  }

  async summary(ac: ScopedAcRequestContext, scope: CreditScope): Promise<CreditsSummary> {
    const account = await this.settled(ac, scope);
    const balances = await this.deps.ledger.balances(this.deps.db, account.id);
    const vendorName = await lookUpNames(this.deps.people, { organizationIds: balances.vendors.map((v) => v.vendorOrganizationId) });
    return {
      accountId: account.id,
      currency: this.deps.catalog.currency,
      balance: balances.platform,
      limited: balances.limited,
      vendorBalances: balances.vendors.map((v) => ({ ...v, vendorName: vendorName(v.vendorOrganizationId) })),
    };
  }

  async lots(ac: ScopedAcRequestContext, scope: CreditScope, page: { page: number; pageSize: number }): Promise<{ rows: LotView[]; total: number }> {
    const account = await this.settled(ac, scope);
    const result = await this.deps.lotRepo.listForAccount(this.deps.db, account.id, page);
    const now = new Date();
    return { rows: result.rows.map((row) => toLotView(row, now)), total: result.total };
  }

  async ledger(ac: ScopedAcRequestContext, scope: CreditScope, page: { page: number; pageSize: number }): Promise<{ rows: LedgerEntry[]; total: number }> {
    const account = await this.settled(ac, scope);
    const result = await this.deps.ledgerRepo.listForAccount(this.deps.db, account.id, page);
    return { rows: result.rows.map(toLedgerEntry), total: result.total };
  }

  /** The caller's own allowance in the active organization, or null when no rule applies — the one credits fact a member sees. */
  async myAllowance(ac: ScopedAcRequestContext): Promise<Allowance | null> {
    const organization = ac.bag.session.organization;
    if (!organization) throw this.deps.errors.badRequest("no active organization");
    await this.deps.ledger.touchMember({ organizationId: organization.id }, ac.bag.session.user.id);
    const readScope = this.deps.engine.resolveRead(ac.permissions, "member_allowance", ac.bag);
    const rows = (await ac.gateDb.read("member_allowance", readScope).rows()) as { accountId: string; userId: string }[];
    const mine = rows.find((row) => row.userId === ac.bag.session.user.id);
    return mine ? this.deps.allowances.forMember(this.deps.db, mine.accountId, mine.userId) : null;
  }

  /** Whether the caller's standing in the active organization lets a rule create credits. */
  private canCreateCredits(ac: ScopedAcRequestContext): boolean {
    return this.deps.engine.allowCreate(ac.permissions, "member_allowance", ac.bag).allow;
  }

  /** The organization's rules, the rule for every member among them (`userId` null), and whether the caller may make one create credits. */
  async allowances(ac: ScopedAcRequestContext): Promise<{ rows: Allowance[]; canCreate: boolean }> {
    const { account } = await this.requireManageable(ac, "organization");
    return { rows: await this.deps.allowances.list(this.deps.db, account.id), canCreate: this.canCreateCredits(ac) };
  }

  /** Saves a member's rule; `userId` null is the rule for every member without one of their own. */
  async setAllowance(ac: ScopedAcRequestContext, userId: string | null, input: AllowanceUpsert): Promise<Allowance> {
    const { account, owner } = await this.requireManageable(ac, "organization");
    if (input.createsCredits && !this.canCreateCredits(ac)) throw this.deps.errors.forbidden("this organization cannot create credits");
    const known = new Set(this.deps.catalog.services.map((s) => s.key));
    const unknown = (input.services ?? []).filter((s) => !known.has(s));
    if (unknown.length) throw this.deps.errors.badRequest(`unknown services: ${unknown.join(", ")}`);
    const rule = { ...input, services: input.services ? [...new Set(input.services)].sort() : null };
    return this.deps.runInTransaction(async (tx) => {
      await this.deps.accountRepo.lockForUpdate(tx, account.id);
      await this.deps.ledger.issueDue(tx, owner, account.id);
      const { allowance, raises } = await this.deps.allowances.set(tx, { accountId: account.id, organizationId: owner.organizationId as string, userId, rule });
      for (const raise of raises) await this.deps.ledger.grant(tx, { owner, reason: "allocation", amount: raise.amount, expiresAt: raise.expiresAt, sourceRef: raise.sourceRef });
      await this.deps.ledger.issueDue(tx, owner, account.id);
      return allowance;
    });
  }

  async clearAllowance(ac: ScopedAcRequestContext, userId: string | null): Promise<boolean> {
    const { account } = await this.requireManageable(ac, "organization");
    return this.deps.runInTransaction(async (tx) => {
      await this.deps.accountRepo.lockForUpdate(tx, account.id);
      return this.deps.allowances.clear(tx, account.id, userId);
    });
  }
}
