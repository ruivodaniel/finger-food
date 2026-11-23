/**
 * InvitationAcceptPage — the signed-in accept page
 * (`/my/invitations/accept?id=`), where the public capability URL and
 * My invitations' "Review & accept" both continue. Shows the invitation from
 * its masked public view, the org type's join consent, and the three answers:
 * Reject, Not now (leaves it pending, back home) and Accept — the primary,
 * enabled once every mandatory join document is checked. Accepting creates
 * the membership; it does not switch the active org.
 *
 * Signed-in only, but never behind the gate: accepting an invitation works
 * while obligations are still owed (accept first, then resolve them).
 */

import * as React from "react";
import { Button, Alert, AlertDescription, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsentDecisionList } from "../../shared/components/ConsentDecisionList";
import {
  InvitationNotPendingAlert,
  InvitationCard,
} from "../../shared/components/InvitationCard";
import { legalDocumentHref } from "../../shared/helpers/legal-doc-paths";
import { invitationsService } from "../../services/application/invitations.service";
import { mounted } from "../../services/application/mount";
import { isApiError } from "../../shared/helpers/api-error";

export interface InvitationAcceptPageProps {
  invitationId: string;
  /** Where Not now and Continue land (the app's signed-in home). */
  homePath?: string;
}

export function InvitationAcceptPage({
  invitationId,
  homePath = "/",
}: InvitationAcceptPageProps): React.ReactElement {
  const { router } = mounted();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<"accepted" | "declined" | null>(null);
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});

  const { data: invitation } = useQuery({
    ...invitationsService.getInvitation(invitationId),
  });

  // The org type's join consent, paired server-side with current documents.
  // Accept stays disabled until every mandatory item with a live document is
  // checked (UX only — the server is the enforcer).
  const joinConsent = invitation?.joinConsent ?? [];
  const consentReady = joinConsent.every(
    (item) =>
      !item.mandatory ||
      item.document === null ||
      (decisions[item.type] ?? false),
  );

  const run = async (
    action: () => Promise<void>,
    outcome: "accepted" | "declined",
  ) => {
    setError(null);
    try {
      await action();
      setDone(outcome);
      // The answer changes the caller's invitations, memberships and gate.
      await queryClient.invalidateQueries();
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    }
  };

  if (done === "accepted") {
    return (
      <Stack dir="col" scale="lg" data-testid="invitation-accept-page">
        <Stack dir="col" scale="xs">
          <Text as="h1" type="heading2">You're in</Text>
          <Text type="body-small" emphasis="quiet">
            You've joined {invitation?.organizationName ?? "the organization"}.
          </Text>
        </Stack>
        <Button
          data-testid="invitation-continue" position="fill"
          onClick={() => void router?.navigate({ to: homePath })}
        >
          Continue
        </Button>
      </Stack>
    );
  }

  return (
    <Stack dir="col" scale="lg" data-testid="invitation-accept-page">
      <Stack dir="col" scale="xs">
        <Text as="h1" type="heading2">You've been invited</Text>
        <Text type="body-small" emphasis="quiet">
          Review the invitation, then accept it to join or decline it.
        </Text>
      </Stack>

      <InvitationCard invitation={invitation} />

      {/* After answering, the refetched status is the answer — say it once. */}
      {invitation && invitation.status !== "pending" && !done && (
        <InvitationNotPendingAlert status={invitation.status} />
      )}

      {done === "declined" && (
        <Alert status="info" data-testid="invitation-declined"><AlertDescription>You've declined this invitation.</AlertDescription></Alert>
      )}

      {invitation?.status === "pending" && !done && (
        <Stack dir="col" scale="lg">
          {joinConsent.length > 0 && (
            <ConsentDecisionList
              items={joinConsent}
              decisions={decisions}
              onDecisionChange={(type, accepted) =>
                setDecisions((d) => ({ ...d, [type]: accepted }))
              }
              viewerHrefFor={(item) =>
                item.document
                  ? legalDocumentHref(item.type, { docId: item.document.id })
                  : undefined
              }
              testIdPrefix="invitation-consent"
            />
          )}
          <Stack dir="row" align="center" scale="sm">
            <Button
              data-testid="invitation-reject"
              status="destructive"
              emphasis="secondary"
              onClick={() =>
                void run(() => invitationsService.rejectInvitation(invitationId), "declined")
              }
            >
              Reject
            </Button>
            <Stack dir="row" justify="end" scale="sm" size="fill">
              <Button
                data-testid="invitation-not-now"
                emphasis="secondary"
                onClick={() => void router?.navigate({ to: homePath })}
              >
                Not now
              </Button>
              <Button
                data-testid="invitation-accept"
                disabled={!consentReady}
                onClick={() =>
                  void run(
                    () =>
                      invitationsService.acceptInvitation(
                        invitationId,
                        joinConsent.length > 0
                          ? joinConsent.map((item) => ({
                              type: item.type,
                              accepted: decisions[item.type] ?? false,
                            }))
                          : undefined,
                      ),
                    "accepted",
                  )
                }
              >
                Accept
              </Button>
            </Stack>
          </Stack>
        </Stack>
      )}

      {error && (
        <Alert status="error" data-testid="invitation-accept-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
