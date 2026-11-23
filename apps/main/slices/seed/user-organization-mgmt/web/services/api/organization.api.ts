// Org-scoped reads/writes name their target org in the URL
// (`/organizations/:orgId/…` — never "current"); the server answers from
// the active org's context, so a non-active org shows only what that
// context's grants reach.

import type {
  InvitationView,
  MemberListView,
  OrganizationDirectoryListView,
  OrganizationView,
} from "../../../shared/types/domain";
import { clientUrl, listQueryString, orgUrl, post, request } from "./http";

export const organizationApi = {
  createOrganization: (body: {
    type: string;
    name: string;
    consents?: Array<{ type: string; accepted: boolean }>;
  }): Promise<OrganizationView> => post(clientUrl("/organizations"), body),
  getOrganization: (orgId: string): Promise<OrganizationView> => request(orgUrl(orgId)),
  updateOrganization: (orgId: string, patch: { name?: string; logo?: string | null }): Promise<OrganizationView> =>
    request(orgUrl(orgId), { method: "PATCH", body: JSON.stringify(patch) }),
  presignOrgLogoUpload: (orgId: string, body: { contentType: string }): Promise<{ uploadUrl: string; publicUrl: string }> =>
    post(orgUrl(orgId, "/logo-upload"), body),
  listOrganizationsDirectory: (query: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OrganizationDirectoryListView> => request(clientUrl(`/organizations?${listQueryString(query)}`)),
  getOrganizationTypes: (): Promise<Array<{ id: string; label: string }>> => request(clientUrl("/organizations/types")),
  /** Self-removal from ANY of the caller's orgs (not just the active one). */
  leaveOrganization: (orgId: string, selfUserId: string): Promise<void> =>
    request(orgUrl(orgId, `/members/${selfUserId}`), { method: "DELETE" }).then(() => undefined),
  listMembers: (orgId: string, query: { search?: string; page?: number; pageSize?: number }): Promise<MemberListView> =>
    request(orgUrl(orgId, `/members?${listQueryString(query)}`)),
  updateMemberRoles: (orgId: string, userId: string, roles: string[]): Promise<void> =>
    request(orgUrl(orgId, `/members/${userId}`), { method: "PATCH", body: JSON.stringify({ roles }) }).then(
      () => undefined,
    ),
  removeMember: (orgId: string, userId: string): Promise<void> =>
    request(orgUrl(orgId, `/members/${userId}`), { method: "DELETE" }).then(() => undefined),
  listOrgInvitations: (orgId: string): Promise<InvitationView[]> => request(orgUrl(orgId, "/invitations")),
  createInvitation: (orgId: string, body: { email?: string; phone?: string; roles: string[] }): Promise<InvitationView> =>
    post(orgUrl(orgId, "/invitations"), body),
  revokeInvitation: (orgId: string, invitationId: string): Promise<void> =>
    post(orgUrl(orgId, `/invitations/${invitationId}/revoke`)).then(() => undefined),
};
