import type { Allowance, AllowanceInput, CreditGrantView, CreditOwner, CreditScope, CreditsSummary, LedgerEntry, LotView, OwnerOption } from "../../../shared/types";
import { clientUrl, http, inOrganization } from "./http";

export interface PageQuery {
  page: number;
  pageSize: number;
}

const list = (path: string, scope: CreditScope, page: PageQuery) => clientUrl(`/credits/${path}?scope=${scope}&page=${page.page}&pageSize=${page.pageSize}`);
/** A member's rule; null is the rule for every member. */
const rule = (userId: string | null) => clientUrl(userId == null ? "/credits/allowance-for-all" : `/credits/allowances/${encodeURIComponent(userId)}`);

export const creditsApi = {
  summary: (scope: CreditScope, organizationId?: string): Promise<CreditsSummary> =>
    http().request(clientUrl(`/credits/summary?scope=${scope}`), inOrganization(organizationId)),
  lots: (scope: CreditScope, page: PageQuery, organizationId?: string): Promise<{ rows: LotView[]; total: number }> =>
    http().request(list("lots", scope, page), inOrganization(organizationId)),
  ledger: (scope: CreditScope, page: PageQuery, organizationId?: string): Promise<{ rows: LedgerEntry[]; total: number }> =>
    http().request(list("ledger", scope, page), inOrganization(organizationId)),

  /** The caller's own allocation in the organization, or null when no rule applies. */
  myAllowance: (organizationId: string): Promise<Allowance | null> =>
    http().request<{ allowance: Allowance | null }>(clientUrl("/credits/me"), inOrganization(organizationId)).then((b) => b.allowance),
  allowances: (organizationId: string): Promise<{ rows: Allowance[]; canCreate: boolean }> =>
    http().request(clientUrl("/credits/allowances"), inOrganization(organizationId)),
  setAllowance: (organizationId: string, userId: string | null, input: AllowanceInput): Promise<Allowance> =>
    http().request(rule(userId), inOrganization(organizationId, { method: "PUT", body: JSON.stringify(input) })),
  clearAllowance: (organizationId: string, userId: string | null): Promise<boolean> =>
    http().request<{ removed: boolean }>(rule(userId), inOrganization(organizationId, { method: "DELETE" })).then((b) => b.removed),

  // the platform owner's admin grants — always with the platform organization in the header
  creditGrants: (organizationId: string, page: PageQuery): Promise<{ rows: CreditGrantView[]; total: number }> =>
    http().request(clientUrl(`/admin/credit-grants?page=${page.page}&pageSize=${page.pageSize}`), inOrganization(organizationId)),
  searchOwners: (organizationId: string, search: string): Promise<OwnerOption[]> =>
    http().request<{ rows: OwnerOption[] }>(clientUrl(`/admin/credit-grants/owners?search=${encodeURIComponent(search)}`), inOrganization(organizationId)).then((b) => b.rows),
  grantCredits: (organizationId: string, input: { owner: CreditOwner; amount: number; services: string[] | null; expiresAt: string | null; priority: number; note?: string }): Promise<{ lotId: string }> =>
    http().request(clientUrl("/admin/credit-grants"), inOrganization(organizationId, { method: "POST", body: JSON.stringify(input) })),
};
