/**
 * Selling service — an organization as a vendor, always the caller's active
 * organization.
 *
 *   status      whether it has a connected account and whether Stripe lets it
 *               take payments; read from Stripe on every look and mirrored
 *   onboarding  the connected account, created once, and a Stripe-hosted link
 *               to start or continue onboarding; the browser returns to Selling
 *   dashboard   a one-time link into the vendor's Express dashboard: balance,
 *               payouts, money refunds, disputes — all Stripe's
 *   products    its catalog, read and changed through the access-control
 *               engine; a product is created only once Stripe confirmed the
 *               account can take payments
 *   sales       its purchases, newest first
 *   buyers      everyone who bought from it, once each — where a promotion may go
 *
 * Standing on the organization's billing (Owner or Manage Billing) and on an
 * organization type the catalog lets sell. `account.updated` on the Connect
 * endpoint keeps the mirror fresh between looks.
 */

import type { Ac, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { paymentPaths } from "../../shared/paths";
import type { PaymentCatalog } from "../../shared/catalog";
import type { BuyerView, CheckoutUrl, ProductView, PurchaseView, VendorStatus } from "../../shared/types";
import type { PaymentAccountSelect } from "../models/payment-account.model";
import type { PaymentProductSelect } from "../models/product.model";
import type { ProductCreate, ProductUpdate } from "../models/payment.schemas";
import type { PaymentAccountRepository } from "../repositories/payment-account.repository";
import type { ProductRepository } from "../repositories/product.repository";
import type { PurchaseRepository } from "../repositories/purchase.repository";
import type { Executor } from "../shared/executor";
import type { ModuleErrors, ModuleLogger } from "../shared/module-errors";
import type { PaymentProvider, ProviderEvent } from "../stripe/provider";
import type { PaymentAccountService } from "./payment-account.service";
import type { People } from "../shared/owner-names";
import { toBuyerViews, toProductViews, toPurchaseViews } from "./views";

export interface SellingServiceDeps {
  accountRepo: PaymentAccountRepository;
  productRepo: ProductRepository;
  purchaseRepo: Pick<PurchaseRepository, "listForSeller" | "listBuyersOfSeller">;
  accounts: Pick<PaymentAccountService, "requireManageable">;
  provider: PaymentProvider | null;
  catalog: Pick<PaymentCatalog, "marketplace">;
  engine: Pick<Ac, "resolveRead" | "allowUpdate" | "allowCreate">;
  db: Executor;
  webAppUrl: string;
  createId: () => string;
  errors: ModuleErrors;
  logger: ModuleLogger;
  /** names the vendor and the buyers */
  people: People;
}

export class SellingService {
  private readonly deps: SellingServiceDeps;

  constructor(deps: SellingServiceDeps) {
    this.deps = deps;
  }

  private get provider(): PaymentProvider {
    if (!this.deps.provider) throw this.deps.errors.unavailable("payments are not configured");
    return this.deps.provider;
  }

  /** The active organization's account, as a vendor: managed by the caller and of a type that may sell. What every vendor action stands on. */
  async requireVendor(ac: ScopedAcRequestContext): Promise<{ account: PaymentAccountSelect; organizationId: string }> {
    const { account, owner } = await this.deps.accounts.requireManageable(ac, "organization");
    const type = ac.bag.session.organization?.type ?? "";
    if (!this.deps.catalog.marketplace.sellerOrgTypes.includes(type)) throw this.deps.errors.forbidden("this kind of organization does not sell on the Marketplace");
    return { account, organizationId: owner.organizationId as string };
  }

  private sellingPage(organizationId: string): string {
    return `${this.deps.webAppUrl}${paymentPaths.selling(organizationId)}`;
  }

  async status(ac: ScopedAcRequestContext): Promise<VendorStatus> {
    const { account } = await this.requireVendor(ac);
    if (!account.stripeAccountId) return { hasAccount: false, chargesEnabled: false };
    let chargesEnabled = account.chargesEnabled;
    if (this.deps.provider) {
      chargesEnabled = (await this.deps.provider.retrieveSellerAccount(account.stripeAccountId)).chargesEnabled;
      if (chargesEnabled !== account.chargesEnabled) await this.deps.accountRepo.patchStripe(this.deps.db, account.id, { chargesEnabled });
    }
    return { hasAccount: true, chargesEnabled };
  }

  async onboarding(ac: ScopedAcRequestContext): Promise<CheckoutUrl> {
    const provider = this.provider;
    const { account, organizationId } = await this.requireVendor(ac);
    let connectedAccountId = account.stripeAccountId;
    if (!connectedAccountId) {
      const country = this.deps.catalog.marketplace.sellerCountry;
      connectedAccountId = (await provider.createSellerAccount({ accountId: account.id, country })).connectedAccountId;
      await this.deps.accountRepo.patchStripe(this.deps.db, account.id, { stripeAccountId: connectedAccountId });
    }
    const page = this.sellingPage(organizationId);
    return provider.onboardingLink({ connectedAccountId, returnUrl: `${page}?onboarding=return`, refreshUrl: `${page}?onboarding=refresh` });
  }

  async dashboard(ac: ScopedAcRequestContext): Promise<CheckoutUrl> {
    const provider = this.provider;
    const { account } = await this.requireVendor(ac);
    if (!account.stripeAccountId) throw this.deps.errors.badRequest("start Stripe onboarding first");
    return provider.dashboardLink({ connectedAccountId: account.stripeAccountId });
  }

  async sales(ac: ScopedAcRequestContext, page: { page: number; pageSize: number }): Promise<{ rows: PurchaseView[]; total: number }> {
    const { organizationId } = await this.requireVendor(ac);
    const result = await this.deps.purchaseRepo.listForSeller(this.deps.db, organizationId, page);
    return { rows: await toPurchaseViews(this.deps.people, result.rows), total: result.total };
  }

  async buyers(ac: ScopedAcRequestContext): Promise<{ rows: BuyerView[] }> {
    const { organizationId } = await this.requireVendor(ac);
    const owners = await this.deps.purchaseRepo.listBuyersOfSeller(this.deps.db, organizationId);
    return { rows: await toBuyerViews(this.deps.people, owners) };
  }

  // ── products, through the engine ──────────────────────────────────────────

  /** The products the caller's read scope admits — the active organization's. */
  private async visibleProducts(ac: ScopedAcRequestContext): Promise<PaymentProductSelect[]> {
    const scope = this.deps.engine.resolveRead(ac.permissions, "product", ac.bag);
    return (await ac.gateDb.read("product", scope).rows()) as PaymentProductSelect[];
  }

  async products(ac: ScopedAcRequestContext): Promise<{ rows: ProductView[] }> {
    const rows = await this.visibleProducts(ac);
    return { rows: await toProductViews(this.deps.people, rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) };
  }

  private checkCurrency(currency: string | undefined) {
    if (currency != null && !this.deps.catalog.marketplace.currencies.includes(currency))
      throw this.deps.errors.badRequest(`products are priced in ${this.deps.catalog.marketplace.currencies.join(", ")}`);
  }

  async createProduct(ac: ScopedAcRequestContext, input: ProductCreate): Promise<ProductView> {
    const verdict = this.deps.engine.allowCreate(ac.permissions, "product", ac.bag);
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "you cannot create products here");
    const { account, organizationId } = await this.requireVendor(ac);
    if (!account.chargesEnabled) throw this.deps.errors.badRequest("Stripe has not confirmed this organization can take payments yet");
    this.checkCurrency(input.currency);
    const row = await this.deps.productRepo.insert(this.deps.db, {
      id: this.deps.createId(), organizationId, name: input.name, description: input.description ?? null,
      unitAmount: input.unitAmount, currency: input.currency, refundPolicy: input.refundPolicy,
    });
    return (await toProductViews(this.deps.people, [row]))[0];
  }

  async updateProduct(ac: ScopedAcRequestContext, productId: string, patch: ProductUpdate): Promise<ProductView> {
    const product = (await this.visibleProducts(ac)).find((p) => p.id === productId);
    if (!product) throw this.deps.errors.forbidden("you cannot manage this product");
    const verdict = this.deps.engine.allowUpdate(ac.permissions, "product", patch, ac.bag);
    if (!verdict.allow) throw this.deps.errors.forbidden(verdict.reason ?? "you cannot manage this product");
    this.checkCurrency(patch.currency);
    const row = await this.deps.productRepo.patch(this.deps.db, product.id, patch);
    return (await toProductViews(this.deps.people, [row as PaymentProductSelect]))[0];
  }

  // ── the Connect event ─────────────────────────────────────────────────────

  /** `account.updated`: the vendor's charges flag, mirrored. */
  async onAccountUpdated(tx: Executor, event: Extract<ProviderEvent, { kind: "account_updated" }>): Promise<void> {
    if (!event.connectedAccountId) return;
    const account = await this.deps.accountRepo.findByStripeAccount(tx, event.connectedAccountId);
    if (!account) {
      this.deps.logger.warn("account.updated for an unknown connected account", { connectedAccountId: event.connectedAccountId, eventId: event.id });
      return;
    }
    await this.deps.accountRepo.patchStripe(tx, account.id, { chargesEnabled: event.chargesEnabled });
  }
}
