/**
 * Marketplace service — the buyer's side of a vendor's product.
 *
 *   listing   every active product of every vendor; public catalog data for
 *             any signed-in person
 *   product   one product, active or not (an old link shows it withdrawn),
 *             with whether its vendor can take a payment right now
 *   checkout  a Stripe Checkout session ON the vendor's connected account (a
 *             direct charge), priced from the product, never from the request,
 *             with the platform fee; the buyer is the scope's billing owner and
 *             proves custody of its account, and is never the vendor itself
 *
 * After the browser is sent to Stripe everything arrives as a payment event
 * on the Connect endpoint:
 *
 *   paid      the purchase is born paid from the session and its metadata
 *             (once per session), its money goes on the buyer's payment
 *             ledger, and the app hears `onPurchaseCompleted`
 *   refunded  the vendor refunded money in its dashboard: the amount is
 *             mirrored onto the purchase; the platform fee stays the platform's
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { platformFeeFor, type PaymentCatalog } from "../../shared/catalog";
import type { PaymentHooks } from "../../shared/hooks";
import { paymentPaths } from "../../shared/paths";
import type { CheckoutUrl, MarketplaceProduct, PaymentOwner, ProductView } from "../../shared/types";
import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PayWithCredits, PurchaseCheckout } from "../models/payment.schemas";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { ProductRepository } from "../repositories/product.repository";
import type { PurchaseRepository } from "../repositories/purchase.repository";
import type { CreditsPort } from "../shared/credits-port";
import type { Executor, RunInTransaction } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { PaymentProvider, ProviderEvent } from "../stripe/provider";
import type { PaymentAccountService } from "./payment-account.service";
import type { PaymentLedgerService } from "./payment-ledger.service";
import type { People } from "../shared/owner-names";
import { toProductViews } from "./views";

export interface MarketplaceServiceDeps {
  accountRepo: PaymentAccountRepository;
  productRepo: ProductRepository;
  purchaseRepo: Pick<PurchaseRepository, "insertCard" | "insertCredits" | "findByPaymentIntent" | "setRefunded">;
  /** the credits purchase: the row and the charge commit together or not at all */
  runInTransaction: RunInTransaction;
  credits: Pick<CreditsPort, "currency" | "chargeVendor">;
  payments: Pick<PaymentLedgerService, "record">;
  accounts: Pick<PaymentAccountService, "requireManageable">;
  provider: PaymentProvider | null;
  catalog: Pick<PaymentCatalog, "marketplace">;
  hooks: Pick<PaymentHooks, "onPurchaseCompleted">;
  db: Executor;
  webAppUrl: string;
  createId: () => string;
  errors: ModuleErrors;
  logger: ModuleLogger;
  /** names the vendors */
  people: People;
}

const ownerOf = (account: PaymentAccountSelect): PaymentOwner =>
  account.organizationId != null ? { organizationId: account.organizationId } : { userId: account.userId as string };

export class MarketplaceService {
  private readonly deps: MarketplaceServiceDeps;

  constructor(deps: MarketplaceServiceDeps) {
    this.deps = deps;
  }

  /** The vendor can be paid: a connected account Stripe has enabled for charges. */
  private async payableSeller(executor: Executor, organizationId: string): Promise<PaymentAccountSelect | null> {
    const seller = await this.deps.accountRepo.findByOwner(executor, { organizationId });
    return seller?.stripeAccountId && seller.chargesEnabled ? seller : null;
  }

  async listing(query: { search?: string; page: number; pageSize: number }): Promise<{ rows: ProductView[]; total: number }> {
    const result = await this.deps.productRepo.listActive(this.deps.db, query);
    return { rows: await toProductViews(this.deps.people, result.rows), total: result.total };
  }

  async product(productId: string): Promise<MarketplaceProduct> {
    const product = await this.deps.productRepo.findById(this.deps.db, productId);
    if (!product) throw this.deps.errors.notFound("product not found");
    const seller = await this.payableSeller(this.deps.db, product.organizationId);
    const [view] = await toProductViews(this.deps.people, [product]);
    return { ...view, vendorCanTakePayments: seller != null };
  }

  async checkout(ac: ScopedAcRequestContext, input: PurchaseCheckout): Promise<CheckoutUrl> {
    if (!this.deps.provider) throw this.deps.errors.unavailable("payments are not configured");
    const provider = this.deps.provider;
    const { account, owner } = await this.deps.accounts.requireManageable(ac, input.scope);
    const product = await this.deps.productRepo.findById(this.deps.db, input.productId);
    if (!product) throw this.deps.errors.notFound("product not found");
    if (!product.active) throw this.deps.errors.badRequest("this product is no longer for sale");
    if (owner.organizationId === product.organizationId) throw this.deps.errors.badRequest("an organization cannot buy its own product");
    const seller = await this.payableSeller(this.deps.db, product.organizationId);
    if (!seller) throw this.deps.errors.badRequest("this vendor cannot take payments right now");

    const feeAmount = platformFeeFor(product.unitAmount * input.quantity, this.deps.catalog.marketplace.platformFeePercent);
    const page = `${this.deps.webAppUrl}${paymentPaths.product(product.id)}`;
    try {
      return await provider.checkoutForPurchase({
        connectedAccountId: seller.stripeAccountId as string,
        accountId: account.id,
        buyerUserId: ac.bag.session.user.id,
        productId: product.id,
        name: product.name,
        description: product.description,
        unitAmount: product.unitAmount,
        currency: product.currency,
        quantity: input.quantity,
        feeAmount,
        successUrl: `${page}?checkout=success`,
        cancelUrl: `${page}?checkout=cancel`,
      });
    } catch (error) {
      // the mirror said yes but Stripe says no: the vendor's account changed since
      this.deps.logger.warn("purchase checkout refused by Stripe", { productId: product.id, error: error instanceof Error ? error.message : String(error) });
      throw this.deps.errors.badRequest("this vendor cannot take payments right now");
    }
  }

  /**
   * A buy paid in full with the credits the buyer holds at the product's
   * vendor: the purchase is born paid in this transaction, the price drawn from
   * those lots; no money moves, no fee, no Stripe. Short credits refuse the
   * whole buy — never part credits, part card.
   */
  async payWithCredits(ac: ScopedAcRequestContext, input: PayWithCredits): Promise<{ purchaseId: string }> {
    const { errors, credits } = this.deps;
    const { account, owner } = await this.deps.accounts.requireManageable(ac, input.scope);
    const product = await this.deps.productRepo.findById(this.deps.db, input.productId);
    if (!product) throw errors.notFound("product not found");
    if (!product.active) throw errors.badRequest("this product is no longer for sale");
    if (owner.organizationId === product.organizationId) throw errors.badRequest("an organization cannot buy its own product");
    if (product.currency !== credits.currency) throw errors.badRequest(`vendor credits pay only for products priced in ${credits.currency.toUpperCase()}`);
    const amount = product.unitAmount * input.quantity;

    return this.deps.runInTransaction(async (tx) => {
      // the charge first, under the purchase's id: short credits refuse before anything is written
      const purchaseId = this.deps.createId();
      const charged = await credits.chargeVendor(tx, {
        owner, vendorOrganizationId: product.organizationId, amount, purchaseId, userId: ac.bag.session.user.id,
      });
      if (!charged.ok) throw errors.badRequest(`the credits held at this vendor (${charged.balance} cents) do not cover ${amount} cents — pay by card`);
      await this.deps.purchaseRepo.insertCredits(tx, {
        id: purchaseId, accountId: account.id, sellerOrganizationId: product.organizationId, productId: product.id,
        productName: product.name, quantity: input.quantity, amountTotal: amount, currency: product.currency,
      });
      await this.deps.hooks.onPurchaseCompleted?.({ purchaseId, sellerOrganizationId: product.organizationId, owner });
      return { purchaseId };
    });
  }

  // ── the payment events (inside the webhook's transaction) ─────────────────

  /** A paid purchase session: the purchase, born paid, once per session. Other sessions are the billing service's. */
  async onPurchasePaid(tx: Executor, event: Extract<ProviderEvent, { kind: "checkout_paid" }>): Promise<void> {
    const s = event.session;
    if (s.metadata.kind !== "purchase" || s.paymentStatus !== "paid") return;
    const product = s.metadata.productId ? await this.deps.productRepo.findById(tx, s.metadata.productId) : null;
    const buyer = s.metadata.accountId ? await this.deps.accountRepo.findById(tx, s.metadata.accountId) : null;
    if (!product || !buyer) {
      this.deps.logger.warn("purchase for an unknown product or account", { sessionId: s.id, metadata: s.metadata, eventId: event.id });
      return;
    }
    // the money must have landed on the product's own vendor
    const seller = await this.deps.accountRepo.findByOwner(tx, { organizationId: product.organizationId });
    if (!seller?.stripeAccountId || seller.stripeAccountId !== event.connectedAccountId) {
      this.deps.logger.warn("purchase paid on an account that is not the product's vendor", { sessionId: s.id, connectedAccountId: event.connectedAccountId, eventId: event.id });
      return;
    }

    const purchase = await this.deps.purchaseRepo.insertCard(tx, {
      id: this.deps.createId(),
      accountId: buyer.id,
      sellerOrganizationId: product.organizationId,
      productId: product.id,
      productName: product.name,
      quantity: Number(s.metadata.quantity) || 1,
      amountTotal: s.amountTotal ?? 0,
      currency: s.currency ?? product.currency,
      applicationFeeAmount: Number(s.metadata.feeAmount) || 0,
      stripeCheckoutSessionId: s.id,
      stripePaymentIntentId: s.paymentIntentId,
    });
    if (!purchase) return; // this session was recorded before

    await this.deps.payments.record(tx, {
      accountId: buyer.id, kind: "purchase", amount: purchase.amountTotal, currency: purchase.currency,
      description: `Bought ${product.name}`, stripeRef: s.id, paymentIntentId: s.paymentIntentId,
    });
    await this.deps.hooks.onPurchaseCompleted?.({ purchaseId: purchase.id, sellerOrganizationId: product.organizationId, owner: ownerOf(buyer) });
  }

  /** `charge.refunded` on a vendor's account: the money refunded so far, mirrored onto the purchase. */
  async onChargeRefunded(tx: Executor, event: Extract<ProviderEvent, { kind: "charge_refunded" }>): Promise<void> {
    if (!event.paymentIntentId) return;
    const purchase = await this.deps.purchaseRepo.findByPaymentIntent(tx, event.paymentIntentId);
    if (!purchase) {
      this.deps.logger.info("refund of a charge that is not a purchase", { paymentIntentId: event.paymentIntentId, eventId: event.id });
      return;
    }
    await this.deps.purchaseRepo.setRefunded(tx, purchase.id, event.amountRefunded, new Date());
  }
}
