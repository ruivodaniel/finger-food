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
import { Button, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery } from "@tanstack/react-query";
import {
  InvitationNotPendingAlert,
  InvitationCard,
} from "../../shared/components/InvitationCard";
import { authenticationService } from "../../services/application/authentication.service";
import { invitationsService } from "../../services/application/invitations.service";
import { mounted } from "../../services/application/mount";

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
  const { router } = mounted();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());
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
    ...invitationsService.getInvitation(invitationId),
  });

  return (
    <Stack dir="col" scale="lg" data-testid="invitation-landing-page">
      <Stack dir="col" scale="xs">
        <Text as="h1" type="heading2">You've been invited</Text>
        <Text type="body-small" emphasis="quiet">
          Sign in or create an account to accept it.
        </Text>
      </Stack>

      <InvitationCard invitation={invitation} />

      {invitation && invitation.status !== "pending" && (
        <InvitationNotPendingAlert status={invitation.status} />
      )}

      {invitation?.status === "pending" && !signedIn && !sessionLoading && (
        <Stack dir="row" justify="end" scale="sm">
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
