/** The caller's memberships, the active one, switching it, and an org's members. */

import { queryOptions } from "@tanstack/react-query";
import type { MembershipFacts } from "../../../shared/types/domain";
import type { SessionResponse } from "../api/auth.api";
import { myOrganizationsApi } from "../api/my-organizations.api";
import { organizationApi } from "../api/organization.api";
import { setActiveOrg } from "../../store/active-organization.store";
import { authenticationService, dropCachedAnswers } from "./authentication.service";
import { mounted } from "./mount";

type MembersQuery = { search?: string; page?: number; pageSize?: number };

const keys = {
  memberships: ["uom", "memberships"] as const,
  orgMembers: (orgId: string | null, query?: { search?: string; page?: number }) =>
    ["uom", "org-members", orgId, query?.search ?? "", query?.page ?? 1] as const,
  // Prefix of every orgMembers key for one org — invalidates all its
  // search/page variants at once.
  orgMembersRoot: (orgId: string | null) => ["uom", "org-members", orgId] as const,
};

export const membershipsService = {
  keys,
  listMyMemberships: () => queryOptions({ queryKey: keys.memberships, queryFn: () => myOrganizationsApi.listMemberships() }),
  /** Pair with `enabled: !!orgId`. */
  listMembers: (orgId: string | null, query: MembersQuery) =>
    queryOptions({ queryKey: keys.orgMembers(orgId, query), queryFn: () => organizationApi.listMembers(orgId!, query) }),

  /**
   * The caller's membership in the session's active organization (id + org
   * type + roles), or null when no org is targeted. The facts ride the
   * session, so nav can filter on first paint with no second fetch.
   */
  getActiveMembership: () =>
    queryOptions({
      ...authenticationService.getSession(),
      select: (data: SessionResponse): MembershipFacts | null => {
        const session = data.session;
        if (!session?.activeOrganizationId) return null;
        return session.memberships.find((m) => m.organizationId === session.activeOrganizationId) ?? null;
      },
    }),

  /**
   * Make an org the caller's active organization. The store changes (the app's
   * client sends it as the context header from now on), and the session
   * refetch carries the new activeOrganizationId, which re-keys the page (the
   * host's account layout keys its slot on it). Every cached answer was given
   * under the old context, so all of them are dropped: the remount starts from
   * loading states instead of flashing the previous org's rows. Resolves once
   * the session carries the new active org, so a caller can navigate into it.
   */
  switchActiveOrg: async (organizationId: string) => {
    setActiveOrg(organizationId);
    dropCachedAnswers();
    await mounted().queryClient.invalidateQueries({ queryKey: authenticationService.keys.session });
  },

  /** Self-removal from ANY of the caller's orgs (not just the active one). */
  leaveOrganization: organizationApi.leaveOrganization,
  updateMemberRoles: organizationApi.updateMemberRoles,
  removeMember: organizationApi.removeMember,
};
