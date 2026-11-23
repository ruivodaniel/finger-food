// Slice query-key catalog — one place, so invalidation never drifts. The
// organization is part of every key: the same scope in two organizations is
// two accounts.

import type { CreditScope } from "../../../shared/types";

export const queryKeys = {
  all: ["credits"] as const,
  summary: (scope: CreditScope, organizationId: string | null) => ["credits", "summary", scope, organizationId] as const,
  lots: (scope: CreditScope, organizationId: string | null, page: number) => ["credits", "lots", scope, organizationId, page] as const,
  ledger: (scope: CreditScope, organizationId: string | null, page: number) => ["credits", "ledger", scope, organizationId, page] as const,
  allowances: (organizationId: string) => ["credits", "allowances", organizationId] as const,
  myAllowance: (organizationId: string) => ["credits", "my-allowance", organizationId] as const,
  members: (organizationId: string) => ["credits", "members", organizationId] as const,
  creditGrants: (organizationId: string, page: number) => ["credits", "credit-grants", organizationId, page] as const,
  ownerSearch: (organizationId: string, search: string) => ["credits", "owner-search", organizationId, search] as const,
};
