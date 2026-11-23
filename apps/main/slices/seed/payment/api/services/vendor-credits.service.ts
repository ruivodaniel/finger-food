/**
 * Vendor credits service — a vendor's own credits, issued by its Owner or
 * Manage Billing, spendable on its products only. They are the vendor's
 * liability: the platform never settles them, and no money moves when they
 * are issued or spent. No Stripe.
 *
 *   credit refund  settles part or all of one of the vendor's purchases in
 *                  credits instead of money: allowed when the purchase was paid
 *                  with the vendor's credits, or when the product's refund
 *                  policy is credits or either; never above what is still
 *                  unsettled (the price minus money refunded and credits
 *                  already issued). The lot carries the catalog's expiry.
 *   promotion      credits with no purchase behind them, to one of the
 *                  vendor's buyers (anyone who ever bought from it, a refunded
 *                  purchase included), with the expiry the vendor chooses.
 *   outstanding    what the vendor has issued in all, and what each holder
 *                  still holds, live.
 *
 * The policy read is the product's current one: a vendor that changes it
 * changes how its past sales may be settled.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { PaymentCatalog } from "../../shared/catalog";
import type { PaymentOwner, VendorCreditsView } from "../../shared/types";
import type { CreditRefund, Promotion } from "../models/payment.schemas";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { ProductRepository } from "../repositories/product.repository";
import type { PurchaseRepository } from "../repositories/purchase.repository";
import type { CreditsPort } from "../shared/credits-port";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors } from "../shared/module-errors";
import { lookUpNames, ownerExists, type People } from "../shared/owner-names";
import type { SellingService } from "./selling.service";

const DAY_MS = 86_400_000;

export interface VendorCreditsServiceDeps {
  selling: Pick<SellingService, "requireVendor">;
  accountRepo: Pick<PaymentAccountRepository, "findById">;
  credits: Pick<CreditsPort, "currency" | "grant" | "issuedBy">;
  productRepo: Pick<ProductRepository, "findById">;
  purchaseRepo: Pick<PurchaseRepository, "lockForUpdate" | "addCreditsRefunded" | "hasBoughtFrom">;
  catalog: Pick<PaymentCatalog, "vendorCredits">;
  db: Executor;
  runInTransaction: RunInTransaction;
  createId: () => string;
  errors: ModuleErrors;
  /** names the holders of the vendor's credits; a promotion's recipient must exist */
  people: People;
}

export class VendorCreditsService {
  private readonly deps: VendorCreditsServiceDeps;

  constructor(deps: VendorCreditsServiceDeps) {
    this.deps = deps;
  }

  async creditRefund(ac: ScopedAcRequestContext, purchaseId: string, input: CreditRefund): Promise<{ purchaseId: string; creditsRefunded: number; unsettled: number }> {
    const { organizationId } = await this.deps.selling.requireVendor(ac);
    const { errors, catalog, credits } = this.deps;
    const days = catalog.vendorCredits.refundExpiresInDays;
    return this.deps.runInTransaction(async (tx) => {
      // the purchase's lock: two refunds of one purchase are counted one after the other
      const purchase = await this.deps.purchaseRepo.lockForUpdate(tx, purchaseId);
      if (!purchase || purchase.sellerOrganizationId !== organizationId) throw errors.forbidden("you cannot settle this purchase");
      const product = await this.deps.productRepo.findById(tx, purchase.productId);
      const inCredits = purchase.paidWith === "vendor_credits" || (product != null && product.refundPolicy !== "money");
      if (!inCredits) throw errors.badRequest("this product is refunded in money only — refund it in the Stripe dashboard");
      if (purchase.currency !== credits.currency) throw errors.badRequest(`credits are in ${credits.currency.toUpperCase()}; this purchase was paid in ${purchase.currency.toUpperCase()}`);
      const unsettled = purchase.amountTotal - purchase.refundedAmount - purchase.creditsRefunded;
      if (input.amount > unsettled) throw errors.badRequest(unsettled > 0 ? `at most ${unsettled} cents of this purchase are still unsettled` : "this purchase is settled");

      const buyer = await this.deps.accountRepo.findById(tx, purchase.accountId);
      if (!buyer) throw errors.internalError(`purchase ${purchase.id} has no buyer account`);
      const owner: PaymentOwner = buyer.organizationId != null ? { organizationId: buyer.organizationId } : { userId: buyer.userId as string };
      await credits.grant(tx, {
        owner, reason: "vendor_refund", amount: input.amount, vendorOrganizationId: organizationId,
        expiresAt: days == null ? null : new Date(Date.now() + days * DAY_MS),
        // one lot per credit refund: a purchase settled in two parts is two lots
        sourceRef: `${purchase.id}:refund:${this.deps.createId()}`,
        issuedByUserId: ac.bag.session.user.id, ref: purchase.id,
      });
      const updated = await this.deps.purchaseRepo.addCreditsRefunded(tx, purchase.id, input.amount);
      return { purchaseId: purchase.id, creditsRefunded: updated!.creditsRefunded, unsettled: unsettled - input.amount };
    });
  }

  async promote(ac: ScopedAcRequestContext, input: Promotion): Promise<{ lotId: string }> {
    const { organizationId } = await this.deps.selling.requireVendor(ac);
    const { errors } = this.deps;
    if (input.expiresAt <= new Date()) throw errors.badRequest("the expiry must be in the future");
    if ("organizationId" in input.owner && input.owner.organizationId === organizationId) throw errors.badRequest("a vendor cannot give its credits to itself");
    const owner = input.owner as PaymentOwner;
    if (!(await this.deps.purchaseRepo.hasBoughtFrom(this.deps.db, organizationId, owner))) throw errors.badRequest("promotions go to your buyers");
    if (!(await ownerExists(this.deps.people, owner))) throw errors.badRequest("no such billing owner");
    return this.deps.runInTransaction(async (tx) => {
      const lot = await this.deps.credits.grant(tx, {
        owner, reason: "promotion", amount: input.amount, vendorOrganizationId: organizationId,
        expiresAt: input.expiresAt, issuedByUserId: ac.bag.session.user.id,
      });
      return { lotId: lot!.id };
    });
  }

  async outstanding(ac: ScopedAcRequestContext): Promise<VendorCreditsView> {
    const { organizationId } = await this.deps.selling.requireVendor(ac);
    const totals = await this.deps.credits.issuedBy(this.deps.db, organizationId);
    const nameOf = await lookUpNames(this.deps.people, {
      organizationIds: totals.holders.flatMap((h) => (h.organizationId ? [h.organizationId] : [])),
      userIds: totals.holders.flatMap((h) => (h.userId ? [h.userId] : [])),
    });
    const holders = totals.holders.map((h) => {
      const owner: PaymentOwner = h.organizationId ? { organizationId: h.organizationId } : { userId: h.userId as string };
      return { owner, ownerName: nameOf(h.organizationId ?? (h.userId as string)), remaining: h.remaining, soonestExpiry: h.soonestExpiry ? h.soonestExpiry.toISOString() : null };
    });
    return {
      currency: this.deps.credits.currency,
      issued: totals.issued,
      outstanding: holders.reduce((sum, h) => sum + h.remaining, 0),
      holders: holders.sort((a, b) => b.remaining - a.remaining),
    };
  }
}
