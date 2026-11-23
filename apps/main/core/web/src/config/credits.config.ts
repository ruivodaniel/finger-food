/**
 * credits web wiring — the app's http client, the catalog, and what the slice
 * may not import itself: the active organization off the uom session, an
 * organization's members (with role labels from the app's access-control
 * catalog) for the weekly limits table, and where to buy more credits (the
 * payment slice's Billing), handed over once at startup. The path uses the
 * slice default (/api/client), matching where the app mounts the credits
 * router.
 */

import { toast } from "@libs/web-components";
import { assignableRolesByOrgType, rolesImpliedBy } from "@configs/access-control";
import { creditsCatalog } from "@configs/credits";
import { mountCreditsWeb, type ActiveOrganization, type CreditsHttp, type CreditsTarget, type MemberSummary } from "@modules/credits/web";
import { paymentPaths } from "@modules/payment/shared";
import { ACTIVE_ORG_HEADER } from "@modules/user-organization-mgmt/shared";
import { authenticationService, membershipsService, useOrganization } from "@modules/user-organization-mgmt/web";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { NAV_ENTRIES, visibleTo } from "@/config/navigation.config";

export function useActiveOrganization(): ActiveOrganization | null {
  const { data } = useQuery(authenticationService.getSession());
  const id = data?.session?.activeOrganizationId ?? null;
  const name = useOrganization("current")?.name ?? "";
  return useMemo(() => (id ? { id, name } : null), [id, name]);
}

/** `company_owner` → "Owner", through the app's assignable-role catalog; unknown roles keep their key. */
function roleLabel(orgType: string | undefined, roles: string[]): string {
  const catalog = (orgType && assignableRolesByOrgType[orgType]) || [];
  return roles.map((role) => catalog.find((r) => r.value === role)?.label ?? role).join(", ");
}

async function listMembers(queryClient: QueryClient, organizationId: string): Promise<MemberSummary[]> {
  const [{ session }, members] = await Promise.all([
    queryClient.fetchQuery(authenticationService.getSession()),
    queryClient.fetchQuery(membershipsService.listMembers(organizationId, { page: 1, pageSize: 100 })),
  ]);
  const orgType = session?.memberships.find((m) => m.organizationId === organizationId)?.orgType;
  return members.rows.map((m) => ({
    userId: m.userId,
    name: m.name ?? m.contact?.value ?? m.userId,
    role: roleLabel(orgType, m.roles),
  }));
}

const billingEntry = NAV_ENTRIES.find((entry) => entry.id === "billing");

/** Credits are bought on Billing (bundles): the person's own always; the active organization's
 *  when the sidebar shows the caller its Billing entry. The server enforces either way. */
function useBuyCreditsOn(target: CreditsTarget, navigate: (path: string) => void): (() => void) | null {
  const { data: membership } = useQuery(membershipsService.getActiveMembership());
  const roles = useMemo(() => rolesImpliedBy(membership?.roles ?? []), [membership]);
  if (target.scope === "account") return () => navigate(paymentPaths.personalBilling);
  const active = !!target.organizationId && membership?.organizationId === target.organizationId;
  if (!active || !billingEntry || !visibleTo(roles)(billingEntry)) return null;
  // the active organization, so the same path as the sidebar's Billing entry
  return () => navigate(billingEntry.to);
}

export function mountCredits(deps: { http: CreditsHttp; queryClient: QueryClient; router: AnyRouter }): void {
  const navigate = (path: string) => void deps.router.navigate({ to: path } as never);
  mountCreditsWeb({
    http: deps.http,
    activeOrgHeader: ACTIVE_ORG_HEADER,
    catalog: creditsCatalog,
    useActiveOrganization,
    listMembers: (organizationId) => listMembers(deps.queryClient, organizationId),
    useBuyCredits: (target) => useBuyCreditsOn(target, navigate),
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    },
  });
}
