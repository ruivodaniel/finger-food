/**
 * In-memory repository implementations — test doubles for docker-free unit
 * tests. They honor the repository interfaces exactly, including what the
 * real tables enforce (one account per owner; one purchase per session; one
 * payment row per Stripe object and kind).
 */

import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentLedgerSelect } from "../models/payment-ledger.model";
import type { PaymentProductSelect } from "../models/product.model";
import type { PaymentPurchaseSelect } from "../models/purchase.model";
import type { ProductPage, ProductPatch, ProductRepository, ProductRow } from "../repositories/product.repository";
import type { CardPurchaseRow, CreditsPurchaseRow, PurchasePage, PurchaseRepository, PurchaseWithBuyer } from "../repositories/purchase.repository";
import type { AccountStripePatch, PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { PaymentLedgerRepository, PaymentPage, PaymentRow } from "../repositories/payment-ledger.repository";
import type { StripeEventRepository } from "../repositories/stripe-event.repository";
import type { PaymentOwner } from "../../shared/types";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { People } from "../shared/owner-names";
import type { Ac } from "@libs/gated-scoped-ac";

let seq = 0;
export const nextId = (prefix = "id") => `${prefix}_${++seq}`;

/** Tests run "in a transaction" by passing a marker no fake ever reads. */
export const FAKE_TX = {} as Executor;
export const runInFakeTransaction: RunInTransaction = (run) => run(FAKE_TX);

/** Plain errors whose message names the kind — tests match on it. */
export const testErrors: ModuleErrors = {
  notFound: (m) => new Error(`not found: ${m ?? ""}`),
  badRequest: (m) => new Error(`bad request: ${m ?? ""}`),
  unauthorized: (m) => new Error(`unauthorized: ${m ?? ""}`),
  forbidden: (m) => new Error(`forbidden: ${m ?? ""}`),
  internalError: (m) => new Error(`internal: ${m ?? ""}`),
  unavailable: (m) => new Error(`unavailable: ${m ?? ""}`),
};

export const silentLogger: ModuleLogger = { info() {}, warn() {}, error() {} };

/**
 * The user-organization slice's naming services. Without a map every id
 * exists, named by itself; with one, only the ids in it do.
 */
export function fakePeople(known?: { organizations?: Record<string, string>; people?: Record<string, string> }): People {
  const lookUp = (names: Record<string, string> | undefined) => async (_visibility: unknown, ids: string[]) =>
    new Map(ids.flatMap((id): [string, string][] => (!names ? [[id, id]] : id in names ? [[id, names[id]]] : [])));
  return {
    organization: { namesByIds: lookUp(known ? known.organizations ?? {} : undefined) },
    userProfile: { namesByIds: lookUp(known ? known.people ?? {} : undefined) },
  };
}

/** The ungated paths never touch the engine; the gated ones are proven on PGlite with the real one. */
export const NO_ENGINE = {
  resolveRead: () => { throw new Error("the engine is not part of this test"); },
  allowUpdate: () => { throw new Error("the engine is not part of this test"); },
  allowCreate: () => { throw new Error("the engine is not part of this test"); },
} as unknown as Pick<Ac, "resolveRead" | "allowUpdate" | "allowCreate">;

/** Reads hand back copies, as a database would: a later write never changes a row a service already holds. */
const snapshot = <T extends object>(row: T | undefined): T | null => (row ? { ...row } : null);

export class InMemoryPaymentAccountRepository implements PaymentAccountRepository {
  rows: PaymentAccountSelect[] = [];

  private matches(row: PaymentAccountSelect, owner: PaymentOwner) {
    return owner.organizationId != null ? row.organizationId === owner.organizationId : row.userId === owner.userId;
  }

  async ensure(_e: Executor, id: string, owner: PaymentOwner): Promise<PaymentAccountSelect> {
    const found = this.rows.find((r) => this.matches(r, owner));
    if (found) return { ...found };
    const row: PaymentAccountSelect = {
      id, organizationId: owner.organizationId ?? null, userId: owner.userId ?? null,
      stripeCustomerId: null, stripeSubscriptionId: null, planKey: null, subscriptionStatus: null, currentPeriodEnd: null,
      stripeAccountId: null, chargesEnabled: false, createdAt: new Date(), updatedAt: new Date(),
    };
    this.rows.push(row);
    return { ...row };
  }
  async findByOwner(_e: Executor, owner: PaymentOwner) { return snapshot(this.rows.find((r) => this.matches(r, owner))); }
  async findById(_e: Executor, id: string) { return snapshot(this.rows.find((r) => r.id === id)); }
  async findByStripeCustomer(_e: Executor, c: string) { return snapshot(this.rows.find((r) => r.stripeCustomerId === c)); }
  async findByStripeAccount(_e: Executor, a: string) { return snapshot(this.rows.find((r) => r.stripeAccountId === a)); }
  async lockForUpdate(_e: Executor, id: string) { return snapshot(this.rows.find((r) => r.id === id)); }
  async patchStripe(_e: Executor, id: string, patch: AccountStripePatch) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch, { updatedAt: new Date() });
    return { ...row };
  }
}

export class InMemoryPaymentLedgerRepository implements PaymentLedgerRepository {
  rows: PaymentLedgerSelect[] = [];

  async append(_e: Executor, row: PaymentRow): Promise<PaymentLedgerSelect | null> {
    if (this.rows.some((r) => r.stripeRef === row.stripeRef && r.kind === row.kind)) return null;
    const full: PaymentLedgerSelect = { ...row, paymentIntentId: row.paymentIntentId ?? null, creditSourceRef: row.creditSourceRef ?? null, creditsGranted: row.creditsGranted ?? 0, createdAt: new Date() };
    this.rows.push(full);
    return { ...full };
  }
  async paidByIntent(_e: Executor, pi: string) {
    return snapshot(this.rows.find((r) => r.paymentIntentId === pi && ["subscription", "bundle", "purchase", "invoice"].includes(r.kind)));
  }
  async refundedByIntent(_e: Executor, pi: string) {
    return 0 - this.rows.filter((r) => r.paymentIntentId === pi && r.kind === "refund").reduce((sum, r) => sum + r.amount, 0);
  }
  async listForAccount(_e: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<PaymentPage> {
    const all = this.rows.filter((r) => r.accountId === accountId).reverse();
    return { rows: all.slice((page.page - 1) * page.pageSize, page.page * page.pageSize).map((r) => ({ ...r })), total: all.length };
  }
}

export class InMemoryProductRepository implements ProductRepository {
  rows: PaymentProductSelect[] = [];

  async insert(_e: Executor, row: ProductRow) {
    const full: PaymentProductSelect = { ...row, active: true, createdAt: new Date(), updatedAt: new Date() };
    this.rows.push(full);
    return { ...full };
  }
  async findById(_e: Executor, id: string) { return snapshot(this.rows.find((r) => r.id === id)); }
  async patch(_e: Executor, id: string, patch: ProductPatch) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch, { updatedAt: new Date() });
    return { ...row };
  }
  async listActive(_e: Executor, query: { search?: string; page: number; pageSize: number }): Promise<ProductPage> {
    const needle = query.search?.toLowerCase();
    const all = this.rows.filter((r) => r.active && (!needle || r.name.toLowerCase().includes(needle))).reverse();
    return { rows: all.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map((r) => ({ ...r })), total: all.length };
  }
}

export class InMemoryPurchaseRepository implements PurchaseRepository {
  rows: PaymentPurchaseSelect[] = [];
  /** the accounts the buyer join reads from */
  private readonly accounts: InMemoryPaymentAccountRepository;

  constructor(accounts: InMemoryPaymentAccountRepository) {
    this.accounts = accounts;
  }

  async insertCard(_e: Executor, row: CardPurchaseRow) {
    if (this.rows.some((r) => r.stripeCheckoutSessionId === row.stripeCheckoutSessionId)) return null;
    const full: PaymentPurchaseSelect = { ...row, paidWith: "card", refundedAmount: 0, refundedAt: null, creditsRefunded: 0, createdAt: new Date() };
    this.rows.push(full);
    return { ...full };
  }
  async insertCredits(_e: Executor, row: CreditsPurchaseRow) {
    const full: PaymentPurchaseSelect = {
      ...row, paidWith: "vendor_credits", applicationFeeAmount: 0, stripeCheckoutSessionId: null, stripePaymentIntentId: null,
      refundedAmount: 0, refundedAt: null, creditsRefunded: 0, createdAt: new Date(),
    };
    this.rows.push(full);
    return { ...full };
  }
  async lockForUpdate(_e: Executor, id: string) { return snapshot(this.rows.find((r) => r.id === id)); }
  async addCreditsRefunded(_e: Executor, id: string, amount: number) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    row.creditsRefunded += amount;
    return { ...row };
  }
  async findByPaymentIntent(_e: Executor, pi: string) { return snapshot(this.rows.find((r) => r.stripePaymentIntentId === pi)); }
  async setRefunded(_e: Executor, id: string, refundedAmount: number, at: Date) {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    row.refundedAmount = refundedAmount;
    row.refundedAt = at;
    return { ...row };
  }
  private page(match: (r: PaymentPurchaseSelect) => boolean, page: { page: number; pageSize: number }): PurchasePage {
    const all: PurchaseWithBuyer[] = this.rows.filter(match).reverse().map((r) => {
      const buyer = this.accounts.rows.find((a) => a.id === r.accountId);
      return { ...r, buyerOrganizationId: buyer?.organizationId ?? null, buyerUserId: buyer?.userId ?? null };
    });
    return { rows: all.slice((page.page - 1) * page.pageSize, page.page * page.pageSize), total: all.length };
  }
  async listForAccount(_e: Executor, accountId: string, page: { page: number; pageSize: number }) { return this.page((r) => r.accountId === accountId, page); }
  async listForSeller(_e: Executor, seller: string, page: { page: number; pageSize: number }) { return this.page((r) => r.sellerOrganizationId === seller, page); }
  async listBuyersOfSeller(_e: Executor, seller: string): Promise<PaymentOwner[]> {
    // newest purchase first, so each buyer's first appearance is their latest
    const accountIds = [...new Set(this.rows.filter((r) => r.sellerOrganizationId === seller).reverse().map((r) => r.accountId))];
    return accountIds.flatMap((id) => {
      const buyer = this.accounts.rows.find((a) => a.id === id);
      if (!buyer) return [];
      return [buyer.organizationId != null ? { organizationId: buyer.organizationId } : { userId: buyer.userId as string }];
    });
  }
  async hasBoughtFrom(_e: Executor, seller: string, owner: PaymentOwner) {
    return this.rows.some((r) => {
      if (r.sellerOrganizationId !== seller) return false;
      const buyer = this.accounts.rows.find((a) => a.id === r.accountId);
      return owner.organizationId != null ? buyer?.organizationId === owner.organizationId : buyer?.userId === owner.userId;
    });
  }
}

export class InMemoryStripeEventRepository implements StripeEventRepository {
  rows: { id: string; type: string }[] = [];

  async claim(_e: Executor, event: { id: string; type: string }) {
    if (this.rows.some((r) => r.id === event.id)) return false;
    this.rows.push(event);
    return true;
  }
}
