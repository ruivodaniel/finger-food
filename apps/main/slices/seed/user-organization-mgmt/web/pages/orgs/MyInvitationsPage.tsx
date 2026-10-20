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
import { Card, CardContent } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { PendingInvitationsList } from "../../components/orgs/PendingInvitationsList";
import { EmptyState } from "../../components/EmptyState";

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
  const { client, router } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useSession();

  const { data: invitations } = useQuery({
    queryKey: queryKeys.myInvitations,
    queryFn: () => client.listMyInvitations(),
    enabled: !!sessionData?.session,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.myInvitations });
    // Accepting an invitation creates a membership.
    void queryClient.invalidateQueries({ queryKey: queryKeys.memberships });
  };

  const items = invitations ?? [];

  return (
    <Stack dir="col" gap={24} data-testid="my-invitations-page" className="w-full max-w-2xl">
      <span element="type--body-small" emphasis="quiet">
        Invitations addressed to your email or phone. Accepting one makes you a member of that
        organization.
      </span>

      <Card>
        <CardContent>
          <Stack dir="col" gap={16}>
            {items.length === 0 ? (
              <EmptyState
                kind="nothing-yet"
                testId="my-invitations-empty"
                icon="mail"
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
        </CardContent>
      </Card>
    </Stack>
  );
}
