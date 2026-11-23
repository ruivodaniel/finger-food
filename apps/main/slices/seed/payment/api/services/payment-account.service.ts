/**
 * Payment account service — the billing owner's row, and everything a
 * signed-in caller may ask about it.
 *
 * Ungated (the named exception): `ensure` creates the row lazily from the
 * session's own identity.
 *
 * Gated (the HTTP surface): the owner a scope names comes from the session
 * only — never from the URL or the body — and the row is read through the
 * access-control engine: the caller's read scope admits it, or they cannot
 * see it. `requireManageable` adds the update verdict; it is what checkout
 * and the portal stand on. Purchases and payments are children of the
 * account: proven on the parent, then read by `account_id`.
 */

import type { Ac, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { BillingScope, BillingSummary, PaymentOwner, PaymentRecord, PurchaseView } from "../../shared/types";
import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { PaymentLedgerRepository } from "../repositories/payment-ledger.repository";
import type { PurchaseRepository } from "../repositories/purchase.repository";
import type { Executor } from "../shared/executor";
import type { ModuleErrors } from "../shared/module-errors";
import type { People } from "../shared/owner-names";
import { toPaymentRecord } from "./payment-ledger.service";
import { toPurchaseViews } from "./views";

export interface PaymentAccountServiceDeps {
  accountRepo: PaymentAccountRepository;
  purchaseRepo: Pick<PurchaseRepository, "listForAccount">;
  paymentRepo: Pick<PaymentLedgerRepository, "listForAccount">;
  engine: Pick<Ac, "resolveRead" | "allowUpdate">;
  /** single statements (reads after the parent was proven) */
  db: Executor;
  createId: () => string;
  errors: ModuleErrors;
  /** names the vendors on the purchases */
  people: People;
}

export const toBillingSummary = (row: PaymentAccountSelect): BillingSummary => ({
  accountId: row.id,
  planKey: row.planKey,
  subscriptionStatus: row.subscriptionStatus,
  currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
  hasCustomer: row.stripeCustomerId != null,
});

const ownsRow = (row: PaymentAccountSelect, owner: PaymentOwner) =>
  owner.organizationId != null ? row.organizationId === owner.organizationId : row.userId === owner.userId;

export class PaymentAccountService {
  private readonly deps: PaymentAccountServiceDeps;

  constructor(deps: PaymentAccountServiceDeps) {
    this.deps = deps;
  }

  // ── ungated ───────────────────────────────────────────────────────────────

  async ensure(executor: Executor, owner: PaymentOwner): Promise<PaymentAccountSelect> {
    return (await this.deps.accountRepo.findByOwner(executor, owner)) ?? this.deps.accountRepo.ensure(executor, this.deps.createId(), owner);
  }

  // ── gated ─────────────────────────────────────────────────────────────────

  /** The billing owner a scope names: the caller, or the caller's active organization. */
  ownerFor(ac: ScopedAcRequestContext, scope: BillingScope): PaymentOwner {
    if (scope === "account") return { userId: ac.bag.session.user.id };
    const organization = ac.bag.session.organization;
    if (!organization) throw this.deps.errors.badRequest("no active organization");
    return { organizationId: organization.id };
  }

  /** The owner's row as the caller's read scope admits it — forbidden when it admits nothing. */
  private async visible(ac: ScopedAcRequestContext, scope: BillingScope): Promise<{ account: PaymentAccountSelect; owner: PaymentOwner }> {
    const owner = this.ownerFor(ac, scope);
    await this.ensure(this.deps.db, owner);
    const readScope = this.deps.engine.resolveRead(ac.permissions, "payment_account", ac.bag);
    const rows = (await ac.gateDb.read("payment_account", readScope).rows()) as PaymentAccountSelect[];
    const account = rows.find((row) => ownsRow(row, owner));
    if (!account) throw this.deps.errors.forbidden("you cannot see this billing account");
    return { account, owner };
  }

  /** The row plus the update verdict — what every write on the account stands on. */
  async requireManageable(ac: ScopedAcRequestContext, scope: BillingScope): Promise<{ account: PaymentAccountSelect; owner: PaymentOwner }> {
    const seen = await this.visible(ac, scope);
    const verdict = this.deps.engine.allowUpdate(ac.permissions, "payment_account", {}, ac.bag);
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "you cannot manage this billing account");
    return seen;
  }

  async summary(ac: ScopedAcRequestContext, scope: BillingScope): Promise<BillingSummary> {
    const { account } = await this.visible(ac, scope);
    return toBillingSummary(account);
  }

  /** What the owner bought, newest first. */
  async purchases(ac: ScopedAcRequestContext, scope: BillingScope, page: { page: number; pageSize: number }): Promise<{ rows: PurchaseView[]; total: number }> {
    const { account } = await this.visible(ac, scope);
    const result = await this.deps.purchaseRepo.listForAccount(this.deps.db, account.id, page);
    return { rows: await toPurchaseViews(this.deps.people, result.rows), total: result.total };
  }

  /** Every movement of real money, newest first. */
  async payments(ac: ScopedAcRequestContext, scope: BillingScope, page: { page: number; pageSize: number }): Promise<{ rows: PaymentRecord[]; total: number }> {
    const { account } = await this.visible(ac, scope);
    const result = await this.deps.paymentRepo.listForAccount(this.deps.db, account.id, page);
    return { rows: result.rows.map(toPaymentRecord), total: result.total };
  }
}
