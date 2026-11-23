/** Invitations: the caller's own, one by id, and an org's (send, revoke). */

import { queryOptions } from "@tanstack/react-query";
import { myOrganizationsApi } from "../api/my-organizations.api";
import { organizationApi } from "../api/organization.api";

const keys = {
  myInvitations: ["uom", "my-invitations"] as const,
  orgInvitations: (orgId: string | null) => ["uom", "org-invitations", orgId] as const,
  invitation: (id: string) => ["uom", "invitation", id] as const,
};

export const invitationsService = {
  keys,
  listMyInvitations: () => queryOptions({ queryKey: keys.myInvitations, queryFn: () => myOrganizationsApi.listMyInvitations() }),
  /** How many invitations await the caller — what a shell badges "My organizations" with. */
  getPendingInvitationCount: () =>
    queryOptions({ ...invitationsService.listMyInvitations(), select: (invitations) => invitations.length }),
  getInvitation: (id: string) =>
    queryOptions({ queryKey: keys.invitation(id), queryFn: () => myOrganizationsApi.getPublicInvitation(id) }),
  /** Pair with `enabled: !!orgId`. */
  listOrganizationInvitations: (orgId: string | null) =>
    queryOptions({ queryKey: keys.orgInvitations(orgId), queryFn: () => organizationApi.listOrgInvitations(orgId!) }),
  acceptInvitation: myOrganizationsApi.acceptInvitation,
  rejectInvitation: myOrganizationsApi.rejectInvitation,
  inviteMember: organizationApi.createInvitation,
  revokeInvitation: organizationApi.revokeInvitation,
};
