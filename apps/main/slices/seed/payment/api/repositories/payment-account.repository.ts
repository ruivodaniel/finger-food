/**
 * Payment account repository — data access for `payment_account`, one row per
 * billing owner. No logic, no throws, no joins: the service decides what an
 * empty result means. Credits are not here; they live in the owner's lots.
 */

import { eq } from "drizzle-orm";
import { paymentAccount, type PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentOwner } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface AccountStripePatch {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  planKey?: string | null;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: Date | null;
  stripeAccountId?: string | null;
  chargesEnabled?: boolean;
}

export interface PaymentAccountRepository {
  /** The owner's row, created if it does not exist yet. */
  ensure(executor: Executor, id: string, owner: PaymentOwner): Promise<PaymentAccountSelect>;
  findByOwner(executor: Executor, owner: PaymentOwner): Promise<PaymentAccountSelect | null>;
  findById(executor: Executor, id: string): Promise<PaymentAccountSelect | null>;
  findByStripeCustomer(executor: Executor, stripeCustomerId: string): Promise<PaymentAccountSelect | null>;
  /** The vendor whose connected account this is. */
  findByStripeAccount(executor: Executor, stripeAccountId: string): Promise<PaymentAccountSelect | null>;
  /** The row, locked for the rest of the transaction — every credit movement on the account starts here. */
  lockForUpdate(tx: Executor, id: string): Promise<PaymentAccountSelect | null>;
  patchStripe(executor: Executor, id: string, patch: AccountStripePatch): Promise<PaymentAccountSelect | null>;
}

const ownerWhere = (owner: PaymentOwner) =>
  owner.organizationId != null
    ? eq(paymentAccount.organizationId, owner.organizationId)
    : eq(paymentAccount.userId, owner.userId);

export class DrizzlePaymentAccountRepository implements PaymentAccountRepository {
  async ensure(executor: Executor, id: string, owner: PaymentOwner): Promise<PaymentAccountSelect> {
    const now = new Date();
    await executor
      .insert(paymentAccount)
      .values({
        id,
        organizationId: owner.organizationId ?? null,
        userId: owner.userId ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
    const row = await this.findByOwner(executor, owner);
    // the insert either created it or found it there — a null here is a broken invariant
    return row as PaymentAccountSelect;
  }

  async findByOwner(executor: Executor, owner: PaymentOwner): Promise<PaymentAccountSelect | null> {
    const rows = await executor.select().from(paymentAccount).where(ownerWhere(owner)).limit(1);
    return rows[0] ?? null;
  }

  async findById(executor: Executor, id: string): Promise<PaymentAccountSelect | null> {
    const rows = await executor.select().from(paymentAccount).where(eq(paymentAccount.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByStripeCustomer(executor: Executor, stripeCustomerId: string): Promise<PaymentAccountSelect | null> {
    const rows = await executor
      .select()
      .from(paymentAccount)
      .where(eq(paymentAccount.stripeCustomerId, stripeCustomerId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByStripeAccount(executor: Executor, stripeAccountId: string): Promise<PaymentAccountSelect | null> {
    const rows = await executor.select().from(paymentAccount).where(eq(paymentAccount.stripeAccountId, stripeAccountId)).limit(1);
    return rows[0] ?? null;
  }

  async lockForUpdate(tx: Executor, id: string): Promise<PaymentAccountSelect | null> {
    const rows = await tx.select().from(paymentAccount).where(eq(paymentAccount.id, id)).for("update");
    return rows[0] ?? null;
  }

  async patchStripe(executor: Executor, id: string, patch: AccountStripePatch): Promise<PaymentAccountSelect | null> {
    const rows = await executor
      .update(paymentAccount)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(paymentAccount.id, id))
      .returning();
    return rows[0] ?? null;
  }
}
