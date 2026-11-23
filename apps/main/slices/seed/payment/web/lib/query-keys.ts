// Slice query-key catalog — one place, so invalidation never drifts. The
// organization is part of every key: the same scope in two organizations is
// two accounts.

import type { BillingScope } from "../../shared/types";

export const queryKeys = {
  all: ["payment"] as const,
  summary: (scope: BillingScope, organizationId: string | null) => ["payment", "summary", scope, organizationId] as const,
  payments: (scope: BillingScope, organizationId: string | null, page: number) => ["payment", "payments", scope, organizationId, page] as const,
  purchases: (scope: BillingScope, organizationId: string | null, page: number) => ["payment", "purchases", scope, organizationId, page] as const,
  vendor: (organizationId: string) => ["payment", "vendor", organizationId] as const,
  products: (organizationId: string) => ["payment", "products", organizationId] as const,
  sales: (organizationId: string, page: number) => ["payment", "sales", organizationId, page] as const,
  buyers: (organizationId: string) => ["payment", "buyers", organizationId] as const,
  vendorCredits: (organizationId: string) => ["payment", "vendor-credits", organizationId] as const,
  marketplace: (search: string, page: number) => ["payment", "marketplace", search, page] as const,
  marketplaceProduct: (productId: string) => ["payment", "marketplace-product", productId] as const,
};
