/**
 * Credit account repository — data access for `credit_account`, one row per
 * credit owner. No logic, no throws, no joins: the service decides what an
 * empty result means. Credits are not here; they live in the owner's lots.
 */

import { eq } from "drizzle-orm";
import { creditAccount, type CreditAccountSelect } from "../models/credit-account.model";
import type { CreditOwner } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface CreditAccountRepository {
  /** The owner's row, created if it does not exist yet. */
  ensure(executor: Executor, id: string, owner: CreditOwner): Promise<CreditAccountSelect>;
  findByOwner(executor: Executor, owner: CreditOwner): Promise<CreditAccountSelect | null>;
  /** The row, locked for the rest of the transaction — every credit movement on the account starts here. */
  lockForUpdate(tx: Executor, id: string): Promise<CreditAccountSelect | null>;
  setPriceList(executor: Executor, id: string, priceList: string | null): Promise<void>;
}

const ownerWhere = (owner: CreditOwner) =>
  owner.organizationId != null ? eq(creditAccount.organizationId, owner.organizationId) : eq(creditAccount.userId, owner.userId);

export class DrizzleCreditAccountRepository implements CreditAccountRepository {
  async ensure(executor: Executor, id: string, owner: CreditOwner): Promise<CreditAccountSelect> {
    const now = new Date();
    await executor
      .insert(creditAccount)
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
    return row as CreditAccountSelect;
  }

  async findByOwner(executor: Executor, owner: CreditOwner): Promise<CreditAccountSelect | null> {
    const rows = await executor.select().from(creditAccount).where(ownerWhere(owner)).limit(1);
    return rows[0] ?? null;
  }

  async lockForUpdate(tx: Executor, id: string): Promise<CreditAccountSelect | null> {
    const rows = await tx.select().from(creditAccount).where(eq(creditAccount.id, id)).for("update");
    return rows[0] ?? null;
  }

  async setPriceList(executor: Executor, id: string, priceList: string | null): Promise<void> {
    await executor.update(creditAccount).set({ priceList, updatedAt: new Date() }).where(eq(creditAccount.id, id));
  }
}
