/**
 * Purchase repository — data access for `purchase`. `insertCard` surfaces
 * the completed handler's idempotency as data: a second row for the same
 * Checkout session is refused by its unique index and `null` comes back, so
 * a redelivered event records nothing twice.
 */

import { and, desc, eq, max, sql } from "drizzle-orm";
import type { PaymentOwner } from "../../shared/types";
import { paymentAccount } from "../models/payment-account.model";
import { paymentPurchase, type PaymentPurchaseSelect } from "../models/purchase.model";
import type { Executor } from "../shared/executor";

export interface CardPurchaseRow {
  id: string;
  accountId: string;
  sellerOrganizationId: string;
  productId: string;
  productName: string;
  quantity: number;
  amountTotal: number;
  currency: string;
  applicationFeeAmount: number;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
}

export type CreditsPurchaseRow = Omit<CardPurchaseRow, "applicationFeeAmount" | "stripeCheckoutSessionId" | "stripePaymentIntentId">;

/** A purchase with its buyer's owner columns — what the vendor's sales list names. */
export type PurchaseWithBuyer = PaymentPurchaseSelect & { buyerOrganizationId: string | null; buyerUserId: string | null };

export interface PurchasePage {
  rows: PurchaseWithBuyer[];
  total: number;
}

export interface PurchaseRepository {
  /** The born-paid row of a card purchase, or null when its session was recorded before. */
  insertCard(tx: Executor, row: CardPurchaseRow): Promise<PaymentPurchaseSelect | null>;
  /** The born-paid row of a purchase paid in full with vendor credits: no fee, no Stripe ids. */
  insertCredits(tx: Executor, row: CreditsPurchaseRow): Promise<PaymentPurchaseSelect>;
  /** The row, locked for the rest of the transaction — a credit refund starts here. */
  lockForUpdate(tx: Executor, id: string): Promise<PaymentPurchaseSelect | null>;
  /** credits_refunded += amount. */
  addCreditsRefunded(tx: Executor, id: string, amount: number): Promise<PaymentPurchaseSelect | null>;
  findByPaymentIntent(executor: Executor, paymentIntentId: string): Promise<PaymentPurchaseSelect | null>;
  /** Mirrors Stripe's refunded amount (a total, not a delta) and the time of the event. */
  setRefunded(tx: Executor, id: string, refundedAmount: number, at: Date): Promise<PaymentPurchaseSelect | null>;
  /** The buyer's purchases, newest first. */
  listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<PurchasePage>;
  /** The vendor's sales, newest first. */
  listForSeller(executor: Executor, sellerOrganizationId: string, page: { page: number; pageSize: number }): Promise<PurchasePage>;
  /** Every billing owner that bought from the vendor, once each, the latest buyer first. */
  listBuyersOfSeller(executor: Executor, sellerOrganizationId: string): Promise<PaymentOwner[]>;
  /** Whether the billing owner ever bought from the vendor; a refunded purchase still counts. */
  hasBoughtFrom(executor: Executor, sellerOrganizationId: string, owner: PaymentOwner): Promise<boolean>;
}

export class DrizzlePurchaseRepository implements PurchaseRepository {
  async insertCard(tx: Executor, row: CardPurchaseRow): Promise<PaymentPurchaseSelect | null> {
    const rows = await tx
      .insert(paymentPurchase)
      .values({ ...row, paidWith: "card", createdAt: new Date() })
      .onConflictDoNothing()
      .returning();
    return rows[0] ?? null;
  }

  async insertCredits(tx: Executor, row: CreditsPurchaseRow): Promise<PaymentPurchaseSelect> {
    const rows = await tx
      .insert(paymentPurchase)
      .values({ ...row, paidWith: "vendor_credits", applicationFeeAmount: 0, createdAt: new Date() })
      .returning();
    return rows[0];
  }

  async lockForUpdate(tx: Executor, id: string): Promise<PaymentPurchaseSelect | null> {
    const rows = await tx.select().from(paymentPurchase).where(eq(paymentPurchase.id, id)).for("update");
    return rows[0] ?? null;
  }

  async addCreditsRefunded(tx: Executor, id: string, amount: number): Promise<PaymentPurchaseSelect | null> {
    const rows = await tx
      .update(paymentPurchase)
      .set({ creditsRefunded: sql`${paymentPurchase.creditsRefunded} + ${amount}` })
      .where(eq(paymentPurchase.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async findByPaymentIntent(executor: Executor, paymentIntentId: string): Promise<PaymentPurchaseSelect | null> {
    const rows = await executor.select().from(paymentPurchase).where(eq(paymentPurchase.stripePaymentIntentId, paymentIntentId)).limit(1);
    return rows[0] ?? null;
  }

  async setRefunded(tx: Executor, id: string, refundedAmount: number, at: Date): Promise<PaymentPurchaseSelect | null> {
    const rows = await tx.update(paymentPurchase).set({ refundedAmount, refundedAt: at }).where(eq(paymentPurchase.id, id)).returning();
    return rows[0] ?? null;
  }

  listForAccount(executor: Executor, accountId: string, page: { page: number; pageSize: number }): Promise<PurchasePage> {
    return this.page(executor, eq(paymentPurchase.accountId, accountId), page);
  }

  listForSeller(executor: Executor, sellerOrganizationId: string, page: { page: number; pageSize: number }): Promise<PurchasePage> {
    return this.page(executor, eq(paymentPurchase.sellerOrganizationId, sellerOrganizationId), page);
  }

  async listBuyersOfSeller(executor: Executor, sellerOrganizationId: string): Promise<PaymentOwner[]> {
    const rows = await executor
      .select({ organizationId: paymentAccount.organizationId, userId: paymentAccount.userId })
      .from(paymentPurchase)
      .innerJoin(paymentAccount, eq(paymentAccount.id, paymentPurchase.accountId))
      .where(eq(paymentPurchase.sellerOrganizationId, sellerOrganizationId))
      .groupBy(paymentAccount.id, paymentAccount.organizationId, paymentAccount.userId)
      .orderBy(desc(max(paymentPurchase.createdAt)), paymentAccount.id);
    return rows.map((r) => (r.organizationId != null ? { organizationId: r.organizationId } : { userId: r.userId as string }));
  }

  async hasBoughtFrom(executor: Executor, sellerOrganizationId: string, owner: PaymentOwner): Promise<boolean> {
    // an account has exactly one owner column set, so matching that one is enough
    const isOwner = owner.organizationId != null ? eq(paymentAccount.organizationId, owner.organizationId) : eq(paymentAccount.userId, owner.userId as string);
    const rows = await executor
      .select({ id: paymentPurchase.id })
      .from(paymentPurchase)
      .innerJoin(paymentAccount, eq(paymentAccount.id, paymentPurchase.accountId))
      .where(and(eq(paymentPurchase.sellerOrganizationId, sellerOrganizationId), isOwner))
      .limit(1);
    return rows.length > 0;
  }

  private async page(executor: Executor, where: ReturnType<typeof eq>, page: { page: number; pageSize: number }): Promise<PurchasePage> {
    const rows = await executor
      .select({ purchase: paymentPurchase, buyerOrganizationId: paymentAccount.organizationId, buyerUserId: paymentAccount.userId })
      .from(paymentPurchase)
      .innerJoin(paymentAccount, eq(paymentAccount.id, paymentPurchase.accountId))
      .where(where)
      .orderBy(desc(paymentPurchase.createdAt), desc(paymentPurchase.id))
      .limit(page.pageSize)
      .offset((page.page - 1) * page.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(paymentPurchase).where(where);
    return { rows: rows.map((r) => ({ ...r.purchase, buyerOrganizationId: r.buyerOrganizationId, buyerUserId: r.buyerUserId })), total };
  }
}
