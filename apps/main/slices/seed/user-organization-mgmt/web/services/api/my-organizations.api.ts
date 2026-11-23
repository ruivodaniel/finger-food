import type { InvitationPublicView, MembershipView, MyInvitationView } from "../../../shared/types/domain";
import { clientUrl, post, request } from "./http";

export const myOrganizationsApi = {
  listMemberships: (): Promise<MembershipView[]> => request(clientUrl("/me/memberships")),
  getCreatableOrganizationTypes: (): Promise<Array<{ id: string; label: string }>> =>
    request(clientUrl("/me/creatable-organization-types")),
  listMyInvitations: (): Promise<MyInvitationView[]> => request(clientUrl("/me/invitations")),
  acceptInvitation: (id: string, consents?: Array<{ type: string; accepted: boolean }>): Promise<void> =>
    post(clientUrl(`/me/invitations/${id}/accept`), { consents }).then(() => undefined),
  rejectInvitation: (id: string): Promise<void> =>
    post(clientUrl(`/me/invitations/${id}/reject`)).then(() => undefined),
  getPublicInvitation: (id: string): Promise<InvitationPublicView> => request(clientUrl(`/invitations/${id}`)),
};
