/**
 * MyInvitationsPage — the caller's pending invitations: accept or decline.
 * Accepting creates a membership, so changes invalidate the memberships
 * query too. Requires a session.
 *
 * The title is the page frame's header band; inside, an intro line, then one
 * Card holding the list (PendingInvitationsList) or an EmptyState. Layout is
 * Stack; no inline styles.
 */

import * as React from "react";
import { Card, Content, EmptyState, Icon, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PendingInvitationsList } from "./components/PendingInvitationsList";
import { authenticationService } from "../../services/application/authentication.service";
import { membershipsService } from "../../services/application/memberships.service";
import { invitationsService } from "../../services/application/invitations.service";
import { mounted } from "../../services/application/mount";

export interface MyInvitationsPageProps {
  loginPath?: string;
  /** The signed-in accept page (`?id=` carries the invitation) — where an
   * invitation whose terms must be reviewed is accepted. */
  acceptInvitationPath?: string;
}

export function MyInvitationsPage({
  loginPath = "/login",
  acceptInvitationPath = "/my/invitations/accept",
}: MyInvitationsPageProps): React.ReactElement | null {
  const { router } = mounted();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());

  const { data: invitations } = useQuery({
    ...invitationsService.listMyInvitations(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: invitationsService.keys.myInvitations });
    // Accepting an invitation creates a membership.
    void queryClient.invalidateQueries({ queryKey: membershipsService.keys.memberships });
  };

  const items = invitations ?? [];

  return (
    <Stack dir="col" scale="xl" data-testid="my-invitations-page">
      <Text type="body-small" emphasis="quiet">
        Invitations addressed to your email or phone. Accepting one makes you a member of that
        organization.
      </Text>

      <Card>
        <Content>
          <Stack dir="col" scale="lg">
            {items.length === 0 ? (
              <EmptyState emphasis="quiet"
                data-testid="my-invitations-empty"
                icon={<Icon name="mail" />}
                title="No pending invitations"
                description="When an organization invites you, it shows up here."
              />
            ) : (
              <PendingInvitationsList
                invitations={items}
                onChanged={refresh}
                onReview={(id) =>
                  void router?.navigate({ to: acceptInvitationPath, search: { id } })
                }
              />
            )}
          </Stack>
        </Content>
      </Card>
    </Stack>
  );
}
