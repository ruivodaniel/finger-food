/**
 * Slice API client — typed fetch wrappers for the slice's own routes. It
 * lives in the slice on purpose: an app that reaches these routes with a raw
 * fetch is a coupling nobody can see.
 *
 * Cookie sessions, so credentials always ride along. An organization-scoped
 * call names its organization in the per-request header (never the URL);
 * the server honors it only for the caller's own memberships.
 */

import type {
  BillingScope,
  BillingSummary,
  BuyerView,
  CheckoutUrl,
  MarketplaceProduct,
  ProductView,
  PaymentOwner,
  PaymentRecord,
  PurchaseView,
  RefundPolicy,
  VendorCreditsView,
  VendorStatus,
} from "../../shared/types";
import type { PaymentWebConfig } from "../types";

/** The seed's session convention: the organization a request acts in. */
export const ACTIVE_ORGANIZATION_HEADER = "x-active-organization";

export class ApiError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** The server declined to serve this caller: signed out (401) or preconditions unmet (428). A state, not a failure. */
export const isUnavailable = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 428);

/** The caller may not see this billing account (403) — a member without Manage Billing, for instance. */
export const isForbidden = (error: unknown): boolean => error instanceof ApiError && error.status === 403;

export interface PaymentPage {
  rows: PaymentRecord[];
  total: number;
}

export interface PurchasePage {
  rows: PurchaseView[];
  total: number;
}

export interface ProductPage {
  rows: ProductView[];
  total: number;
}

/** What the product form sends; the price in minor units. */
export interface ProductInput {
  name: string;
  description?: string;
  unitAmount: number;
  currency: string;
  refundPolicy: RefundPolicy;
}

export type ProductChange = Partial<Omit<ProductInput, "description">> & { description?: string | null; active?: boolean };

export type CheckoutItem = { planKey: string } | { bundleKey: string };

export interface PaymentApiClient {
  summary(scope: BillingScope, organizationId?: string): Promise<BillingSummary>;
  payments(scope: BillingScope, page: { page: number; pageSize: number }, organizationId?: string): Promise<PaymentPage>;
  checkout(scope: BillingScope, item: CheckoutItem, organizationId?: string): Promise<CheckoutUrl>;
  portal(scope: BillingScope, organizationId?: string): Promise<CheckoutUrl>;
  purchases(scope: BillingScope, page: { page: number; pageSize: number }, organizationId?: string): Promise<PurchasePage>;

  // the organization as a vendor — always the organization named in the header
  vendor(organizationId: string): Promise<VendorStatus>;
  onboarding(organizationId: string): Promise<CheckoutUrl>;
  dashboard(organizationId: string): Promise<CheckoutUrl>;
  sales(organizationId: string, page: { page: number; pageSize: number }): Promise<PurchasePage>;
  buyers(organizationId: string): Promise<BuyerView[]>;
  products(organizationId: string): Promise<ProductView[]>;
  createProduct(organizationId: string, input: ProductInput): Promise<ProductView>;
  updateProduct(organizationId: string, productId: string, change: ProductChange): Promise<ProductView>;
  vendorCredits(organizationId: string): Promise<VendorCreditsView>;
  creditRefund(organizationId: string, purchaseId: string, amount: number): Promise<{ purchaseId: string; creditsRefunded: number; unsettled: number }>;
  promote(organizationId: string, input: { owner: PaymentOwner; amount: number; expiresAt: string }): Promise<{ lotId: string }>;

  // the buyer's side
  marketplace(query: { search?: string; page: number; pageSize: number }): Promise<ProductPage>;
  marketplaceProduct(productId: string): Promise<MarketplaceProduct>;
  buy(scope: BillingScope, input: { productId: string; quantity: number }, organizationId?: string): Promise<CheckoutUrl>;
  payWithCredits(scope: BillingScope, input: { productId: string; quantity: number }, organizationId?: string): Promise<{ purchaseId: string }>;
}

function messageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>).error;
  return typeof value === "string" ? value : null;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createPaymentApiClient(config: PaymentWebConfig): PaymentApiClient {
  const base = `${config.apiBaseUrl}${config.clientPath ?? "/api/client"}`;
  const header = config.activeOrganizationHeader ?? ACTIVE_ORGANIZATION_HEADER;

  async function request<T>(url: string, init?: RequestInit, organizationId?: string): Promise<T> {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(organizationId ? { [header]: organizationId } : {}),
      },
      ...init,
    });
    const text = await response.text();
    const body = text ? safeJson(text) : undefined;
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.status >= 500 && response.status !== 503
          ? "Something went wrong — please try again."
          : (messageOf(body) ?? "Something went wrong — please try again."),
        body,
      );
    }
    return body as T;
  }

  const json = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

  return {
    summary: (scope, organizationId) => request(`${base}/billing/summary?scope=${scope}`, undefined, organizationId),
    payments: (scope, page, organizationId) =>
      request(`${base}/billing/payments?scope=${scope}&page=${page.page}&pageSize=${page.pageSize}`, undefined, organizationId),
    checkout: (scope, item, organizationId) => request(`${base}/billing/checkout`, json({ scope, ...item }), organizationId),
    portal: (scope, organizationId) => request(`${base}/billing/portal`, json({ scope }), organizationId),
    purchases: (scope, page, organizationId) =>
      request(`${base}/billing/purchases?scope=${scope}&page=${page.page}&pageSize=${page.pageSize}`, undefined, organizationId),

    vendor: (organizationId) => request(`${base}/selling/vendor`, undefined, organizationId),
    onboarding: (organizationId) => request(`${base}/selling/onboarding`, { method: "POST" }, organizationId),
    dashboard: (organizationId) => request(`${base}/selling/dashboard`, { method: "POST" }, organizationId),
    sales: (organizationId, page) => request(`${base}/selling/sales?page=${page.page}&pageSize=${page.pageSize}`, undefined, organizationId),
    buyers: (organizationId) => request<{ rows: BuyerView[] }>(`${base}/selling/buyers`, undefined, organizationId).then((b) => b.rows),
    products: (organizationId) => request<{ rows: ProductView[] }>(`${base}/selling/products`, undefined, organizationId).then((b) => b.rows),
    createProduct: (organizationId, input) => request(`${base}/selling/products`, json(input), organizationId),
    updateProduct: (organizationId, productId, change) =>
      request(`${base}/selling/products/${encodeURIComponent(productId)}`, { method: "PATCH", body: JSON.stringify(change) }, organizationId),
    vendorCredits: (organizationId) => request(`${base}/selling/credits`, undefined, organizationId),
    creditRefund: (organizationId, purchaseId, amount) =>
      request(`${base}/selling/purchases/${encodeURIComponent(purchaseId)}/credit-refund`, json({ amount }), organizationId),
    promote: (organizationId, input) => request(`${base}/selling/promotions`, json(input), organizationId),

    marketplace: (query) => {
      const search = query.search ? `&search=${encodeURIComponent(query.search)}` : "";
      return request(`${base}/marketplace/products?page=${query.page}&pageSize=${query.pageSize}${search}`);
    },
    marketplaceProduct: (productId) => request(`${base}/marketplace/products/${encodeURIComponent(productId)}`),
    buy: (scope, input, organizationId) => request(`${base}/marketplace/checkout`, json({ scope, ...input, paidWith: "card" }), organizationId),
    payWithCredits: (scope, input, organizationId) => request(`${base}/marketplace/pay-with-credits`, json({ scope, ...input }), organizationId),
  };
}
