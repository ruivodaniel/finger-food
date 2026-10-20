/**
 * InvitationLandingPage — the invitation capability URL
 * (`/accept-invitation?id=`), where an invitation link lands. Public: shows
 * the org + roles from a masked public view. Accepting happens on the
 * signed-in accept page: a signed-out visitor signs in (the intention points
 * there) or creates an account (register-and-join, carrying the invitation
 * id, lands there too); a signed-in visitor is handed straight over.
 *
 * A Stack inside the auth Card — a heading block, the inviting org, the
 * actions as a row; a status that is no longer pending as an Alert.
 */

import * as React from "react";
import { Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import {
  InvitationNotPendingAlert,
  InvitationCard,
} from "../../components/orgs/InvitationCard";

export interface InvitationLandingPageProps {
  invitationId: string;
  loginPath?: string;
  registerPath?: string;
  /** The signed-in accept page (`?id=` carries the invitation). */
  acceptInvitationPath?: string;
}

export function InvitationLandingPage({
  invitationId,
  loginPath = "/login",
  registerPath = "/register",
  acceptInvitationPath = "/my/invitations/accept",
}: InvitationLandingPageProps): React.ReactElement {
  const { client, router } = useUserOrgMgmtContext();
  const { data: sessionData, isLoading: sessionLoading } = useSession();
  const signedIn = !sessionLoading && !!sessionData?.session;

  // Signed in already — accepting is the signed-in page's job.
  React.useEffect(() => {
    if (signedIn) {
      void router?.navigate({
        to: acceptInvitationPath,
        search: { id: invitationId },
        replace: true,
      });
    }
  }, [signedIn, router, acceptInvitationPath, invitationId]);

  const { data: invitation } = useQuery({
    queryKey: queryKeys.invitation(invitationId),
    queryFn: () => client.getPublicInvitation(invitationId),
  });

  return (
    <Stack dir="col" gap={20} data-testid="invitation-landing-page">
      <Stack dir="col" gap={6}>
        <h1 element="type--heading2">You've been invited</h1>
        <span element="type--body-small" emphasis="quiet">
          Sign in or create an account to accept it.
        </span>
      </Stack>

      <InvitationCard invitation={invitation} />

      {invitation && invitation.status !== "pending" && (
        <InvitationNotPendingAlert status={invitation.status} />
      )}

      {invitation?.status === "pending" && !signedIn && !sessionLoading && (
        <Stack dir="row" justify="end" gap={8}>
          <Button
            data-testid="invitation-to-register"
            emphasis="secondary"
            onClick={() =>
              void router?.navigate({
                to: registerPath,
                search: { invitationId },
              })
            }
          >
            Create an account
          </Button>
          <Button
            data-testid="invitation-to-login"
            onClick={() =>
              void router?.navigate({
                to: loginPath,
                search: {
                  intention: `${acceptInvitationPath}?id=${encodeURIComponent(invitationId)}`,
                },
              })
            }
          >
            Sign in
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
