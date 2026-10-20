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
import { Button } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { ConsentDecisionList } from "../../components/legal/ConsentDecisionList";
import {
  InvitationNotPendingAlert,
  InvitationCard,
} from "../../components/orgs/InvitationCard";
import { legalDocumentHref } from "../../lib/legal-doc-paths";
import { StatusAlert } from "../../components/StatusAlert";

export interface InvitationAcceptPageProps {
  invitationId: string;
  /** Where Not now and Continue land (the app's signed-in home). */
  homePath?: string;
}

export function InvitationAcceptPage({
  invitationId,
  homePath = "/",
}: InvitationAcceptPageProps): React.ReactElement {
  const { client, router } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<"accepted" | "declined" | null>(null);
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});

  const { data: invitation } = useQuery({
    queryKey: queryKeys.invitation(invitationId),
    queryFn: () => client.getPublicInvitation(invitationId),
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
      setError(e instanceof ApiError ? e.message : "something went wrong");
    }
  };

  if (done === "accepted") {
    return (
      <Stack dir="col" gap={20} data-testid="invitation-accept-page">
        <Stack dir="col" gap={6}>
          <h1 element="type--heading2">You're in</h1>
          <span element="type--body-small" emphasis="quiet">
            You've joined {invitation?.organizationName ?? "the organization"}.
          </span>
        </Stack>
        <Button
          data-testid="invitation-continue"
          fill
          onClick={() => void router?.navigate({ to: homePath })}
        >
          Continue
        </Button>
      </Stack>
    );
  }

  return (
    <Stack dir="col" gap={20} data-testid="invitation-accept-page">
      <Stack dir="col" gap={6}>
        <h1 element="type--heading2">You've been invited</h1>
        <span element="type--body-small" emphasis="quiet">
          Review the invitation, then accept it to join or decline it.
        </span>
      </Stack>

      <InvitationCard invitation={invitation} />

      {/* After answering, the refetched status is the answer — say it once. */}
      {invitation && invitation.status !== "pending" && !done && (
        <InvitationNotPendingAlert status={invitation.status} />
      )}

      {done === "declined" && (
        <StatusAlert status="info" testId="invitation-declined">You've declined this invitation.</StatusAlert>
      )}

      {invitation?.status === "pending" && !done && (
        <Stack dir="col" gap={16}>
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
          <Stack dir="row" align="center" gap={8}>
            <Button
              data-testid="invitation-reject"
              status="destructive"
              emphasis="secondary"
              onClick={() =>
                void run(() => client.rejectInvitation(invitationId), "declined")
              }
            >
              Reject
            </Button>
            <Stack dir="row" justify="end" gap={8} size="fill">
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
                      client.acceptInvitation(
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
        <StatusAlert status="error" testId="invitation-accept-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
