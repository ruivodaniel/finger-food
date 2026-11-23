/**
 * OrgMembersPage — /organizations/:organizationId|current/members. One org's
 * people: searchable, paginated member table (edit roles / remove via a
 * sheet), an invitations view behind the same view select, and inviting
 * from the toolbar (sheet). The URL names the org (`current` aliases the
 * session's active org) and every request carries that id in its path —
 * VIEWING an org never activates it; the server answers from the active
 * org's context. Requires a session.
 *
 * The org's name and the Info · Members section nav are the org layout's (the
 * hosting app mounts it around the page), so the page renders neither;
 * inside, an intro line, then one Card holding the toolbar row (search +
 * view select, Invite at the end), the members table or the invitations
 * list, and the pagination; sheets stay outside it. The two whole-page
 * states (no active org, org not available) are EmptyStates. Layout is
 * Stack; no inline styles.
 */

import * as React from "react";
import { Button, Card, Content, Input, InputSelect, Sheet, SheetContent, Header, SheetTitle, EmptyState, Icon, Text, SheetClose } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useResolvedOrgId } from "../../shared/hooks/use-resolved-org-id";
import { MembersTable } from "./components/MembersTable";
import { EditMemberSheet } from "./components/EditMemberSheet";
import { InvitationsList } from "./components/InvitationsList";
import { InviteMemberForm } from "./components/InviteMemberForm";
import type { MemberView } from "../../../shared/types/domain";
import { authenticationService } from "../../services/application/authentication.service";
import { organizationsService } from "../../services/application/organizations.service";
import { membershipsService } from "../../services/application/memberships.service";
import { invitationsService } from "../../services/application/invitations.service";
import { mounted } from "../../services/application/mount";

const PAGE_SIZE = 20;

export interface OrgMembersPageProps {
  organizationId: string;
  loginPath?: string;
}

export function OrgMembersPage({
  organizationId,
  loginPath = "/login",
}: OrgMembersPageProps): React.ReactElement | null {
  const { router } = mounted();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());
  const { orgId, isCurrent, isResolving } = useResolvedOrgId(organizationId);
  const [view, setView] = React.useState<"members" | "invitations">("members");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MemberView | null>(null);

  const enabled = !!orgId;
  const memberQuery = {
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };
  const { data: org, isError } = useQuery({
    ...organizationsService.getOrganization(orgId),
    enabled,
    // An id the active org's context can't read 404s by design —
    // fail fast into the "not available" state instead of retrying.
    retry: false,
  });
  const { data: members } = useQuery({
    ...membershipsService.listMembers(orgId, memberQuery),
    enabled: enabled && !isError && view === "members",
  });
  const { data: invitations } = useQuery({
    ...invitationsService.listOrganizationInvitations(orgId),
    enabled: enabled && !isError && view === "invitations",
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const refreshMembers = () =>
    queryClient.invalidateQueries({
      queryKey: membershipsService.keys.orgMembersRoot(orgId),
    });
  const refreshInvitations = () =>
    queryClient.invalidateQueries({
      queryKey: invitationsService.keys.orgInvitations(orgId),
    });

  if (isCurrent && !isResolving && !orgId) {
    return (
      <Stack dir="col" scale="xl" data-testid="org-members-page">
        <EmptyState emphasis="quiet"
          data-testid="no-active-org"
          icon={<Icon name="building" />}
          title="No active organization"
          description="You're not in any organization yet — create or join one from Organizations."
        />
      </Stack>
    );
  }
  if (!orgId) return null;

  if (isError) {
    return (
      <Stack dir="col" scale="xl" data-testid="org-members-page">
        <EmptyState emphasis="quiet"
          data-testid="org-not-available"
          icon={<Icon name="accessDenied" />}
          title="Organization not available"
          description="This organization doesn't exist, or you're not a member of it."
        />
      </Stack>
    );
  }

  return (
    <Stack dir="col" scale="xl" data-testid="org-members-page">
      <Text type="body-small" emphasis="quiet">
        The organization's members and their roles, and its open invitations. Search by name,
        switch the view to invitations, or invite someone.
      </Text>

      <Card>
        <Content>
          <Stack dir="col" scale="lg">
            {/* wraps: beside the org panel the column can be narrower than
                search + view select + Invite, which must never be clipped */}
            <Stack dir="row" align="center" justify="between" scale="md" wrap>
              <Stack dir="row" align="center" scale="md">
                <Input
                  data-testid="members-search-input"
                  value={search}
                  placeholder="Search by name"
                  onChange={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                />
                <InputSelect
                  data-testid="members-filter-select"
                  clearable={false}
                  value={view}
                  onChange={(next) => next && setView(next as typeof view)}
                  options={[
                    { value: "members", label: "Members" },
                    { value: "invitations", label: "Invitations" },
                  ]}
                />
              </Stack>
              <Button
                data-testid="members-invite-btn"
                buttonType="icon-text"
                startIcon="add"
                onClick={() => setInviteOpen(true)}
              >
                Invite member
              </Button>
            </Stack>

            {view === "members" ? (
              <MembersTable
                orgType={org?.type}
                members={members?.rows ?? []}
                onEdit={setEditing}
              />
            ) : (
              <InvitationsList
                organizationId={orgId}
                orgType={org?.type}
                invitations={invitations ?? []}
                onChanged={() => void refreshInvitations()}
              />
            )}

            {view === "members" && (
              <ListPagination
                query={{ page, pageSize: PAGE_SIZE }}
                total={members?.total ?? 0}
                onPageChange={setPage}
              />
            )}
          </Stack>
        </Content>
      </Card>

      <EditMemberSheet
        organizationId={orgId}
        orgType={org?.type}
        member={editing}
        onClose={() => setEditing(null)}
        onChanged={() => void refreshMembers()}
      />

      <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
        <SheetContent>
          <Header><Stack dir="row" align="center" justify="between"><SheetTitle>Invite a Member</SheetTitle><SheetClose asChild><Button buttonType="icon" startIcon="close" emphasis="secondary" scale="sm" aria-label="Close" data-testid="invite-member-sheet-close-btn" /></SheetClose></Stack></Header>
          <Stack dir="col">
            <InviteMemberForm
              organizationId={orgId}
              orgType={org?.type}
              channels={org?.inviteChannels ?? []}
              onInvited={() => {
                setInviteOpen(false);
                void refreshInvitations();
              }}
            />
          </Stack>
        </SheetContent>
      </Sheet>
    </Stack>
  );
}
