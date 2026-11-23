/**
 * Payment ledger service — real money, on the record. The billing and
 * marketplace services write what was paid; this service answers the events
 * that send money back:
 *
 *   refund      `charge.refunded` reports the running total: the row is the
 *               difference from what was already recorded, so two refunds of
 *               one charge are two rows and a late event writes nothing. Takes
 *               back what is left of the credits the refunded part paid for.
 *   chargeback  the bank pulled the money: a negative row and the same take
 *               back. A dispute won is a positive row; credits already taken
 *               stay taken.
 *
 * Everything runs inside the webhook's transaction, the account locked, so the
 * money row and the credits row commit together or not at all.
 */

import type { PaymentOwner, PaymentRecord } from "../../shared/types";
import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentLedgerSelect } from "../models/payment-ledger.model";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { PaymentLedgerRepository, PaymentRow } from "../repositories/payment-ledger.repository";
import type { CreditsPort } from "../shared/credits-port";
import type { Executor } from "../shared/executor";
import type { ModuleLogger } from "../shared/module-errors";
import type { ProviderEvent } from "../stripe/provider";

export interface PaymentLedgerServiceDeps {
  ledgerRepo: PaymentLedgerRepository;
  accountRepo: Pick<PaymentAccountRepository, "lockForUpdate">;
  credits: Pick<CreditsPort, "takeBack">;
  createId: () => string;
  logger: ModuleLogger;
}

export const toPaymentRecord = (row: PaymentLedgerSelect): PaymentRecord => ({
  id: row.id,
  kind: row.kind,
  amount: row.amount,
  currency: row.currency,
  description: row.description,
  creditsGranted: row.creditsGranted,
  createdAt: row.createdAt.toISOString(),
});

const ownerOf = (account: PaymentAccountSelect): PaymentOwner =>
  account.organizationId != null ? { organizationId: account.organizationId } : { userId: account.userId as string };

export class PaymentLedgerService {
  private readonly deps: PaymentLedgerServiceDeps;

  constructor(deps: PaymentLedgerServiceDeps) {
    this.deps = deps;
  }

  /** One row of money. A Stripe object recorded before writes nothing. */
  async record(tx: Executor, row: Omit<PaymentRow, "id">): Promise<void> {
    await this.deps.ledgerRepo.append(tx, { id: this.deps.createId(), ...row });
  }

  /** The share of a payment's credits a returned amount paid for, rounded up. */
  private async takeBackShare(tx: Executor, original: PaymentLedgerSelect, account: PaymentAccountSelect, returned: number, eventId: string): Promise<void> {
    if (!original.creditSourceRef || original.creditsGranted <= 0 || original.amount <= 0) return;
    const upTo = Math.ceil((original.creditsGranted * returned) / original.amount);
    await this.deps.credits.takeBack(tx, ownerOf(account), { sourceRef: original.creditSourceRef, upTo, sourceEventId: eventId });
  }

  async onChargeRefunded(tx: Executor, event: Extract<ProviderEvent, { kind: "charge_refunded" }>): Promise<void> {
    if (!event.paymentIntentId) return;
    const original = await this.deps.ledgerRepo.paidByIntent(tx, event.paymentIntentId);
    if (!original) {
      this.deps.logger.info("refund of a charge not on the payment ledger", { paymentIntentId: event.paymentIntentId, eventId: event.id });
      return;
    }
    // the lock first: two refunds of one charge are counted one after the other
    const account = await this.deps.accountRepo.lockForUpdate(tx, original.accountId);
    if (!account) return;
    const returned = event.amountRefunded - (await this.deps.ledgerRepo.refundedByIntent(tx, event.paymentIntentId));
    if (returned <= 0) return; // an older total arriving late
    await this.record(tx, {
      accountId: account.id, kind: "refund", amount: -returned, currency: original.currency, description: `Refund: ${original.description}`,
      stripeRef: event.id, paymentIntentId: event.paymentIntentId,
    });
    await this.takeBackShare(tx, original, account, returned, event.id);
  }

  async onDisputeFunds(tx: Executor, event: Extract<ProviderEvent, { kind: "dispute_funds" }>): Promise<void> {
    if (!event.paymentIntentId) return;
    const original = await this.deps.ledgerRepo.paidByIntent(tx, event.paymentIntentId);
    if (!original) {
      this.deps.logger.info("dispute of a charge not on the payment ledger", { paymentIntentId: event.paymentIntentId, eventId: event.id });
      return;
    }
    const account = await this.deps.accountRepo.lockForUpdate(tx, original.accountId);
    if (!account) return;
    const withdrawn = event.direction === "withdrawn";
    await this.record(tx, {
      accountId: account.id,
      kind: withdrawn ? "chargeback" : "chargeback_reversal",
      amount: withdrawn ? -event.amount : event.amount,
      currency: original.currency,
      description: `${withdrawn ? "Chargeback" : "Chargeback reversed"}: ${original.description}`,
      stripeRef: event.disputeId,
      paymentIntentId: event.paymentIntentId,
    });
    if (withdrawn) await this.takeBackShare(tx, original, account, event.amount, event.id);
  }
}
