/**
 * PendingInvitationsList — invitations addressed to the signed-in caller's
 * identifiers, with accept / decline. Empty when there are none.
 *
 * A List: each invitation a row — a mail Tile · the inviting org (the title)
 * over its type and the roles offered, then "sent to <identifier> · expires
 * <date>" · Accept and Decline as the row actions. Errors as an Alert.
 *
 * An invitation whose org type demands join consent can't be accepted from
 * the row — the terms have to be shown and decided — so its action is
 * "Review & accept", handing over to the accept page (onReview).
 */

import * as React from "react";
import {
  Button,
  Icon,
  List,
  ListItem,
  ListItemAction,
  ListItemContent,
  ListItemDescription,
  ListItemIcon,
  ListItemTitle,
  Tile,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useRoleLabels } from "../../hooks/use-role-labels";
import { ApiError } from "../../lib/api-client";
import type { MyInvitationView } from "../../../shared/types/domain";
import { StatusAlert } from "../StatusAlert";

export interface PendingInvitationsListProps {
  invitations: MyInvitationView[];
  onChanged: () => void;
  /** Open the accept page for an invitation that needs its terms reviewed. */
  onReview: (invitationId: string) => void;
}

/** The expiry as a short date, or null when the row carries none. */
const expiresOn = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export function PendingInvitationsList({
  invitations,
  onChanged,
  onReview,
}: PendingInvitationsListProps): React.ReactElement | null {
  const { client } = useUserOrgMgmtContext();
  const roleLabels = useRoleLabels();
  const [error, setError] = React.useState<string | null>(null);

  if (invitations.length === 0) return null;

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    }
  };

  return (
    <Stack dir="col" gap={12} data-testid="pending-invitations">
      <List position="fill">
        {invitations.map((invitation) => {
          const expires = expiresOn(invitation.expiresAt);
          return (
            <ListItem
              key={invitation.id}
              data-testid={`pending-invitation-${invitation.id}`}
             
            >
              <ListItemIcon>
                <Tile emphasis="quiet">
                  <Icon name="mail" size="sm" />
                </Tile>
              </ListItemIcon>
              <ListItemContent>
                <Stack dir="col" gap={2}>
                  <ListItemTitle data-testid={`pending-invitation-${invitation.id}-org`}>
                    {invitation.organization.name}
                  </ListItemTitle>
                  <ListItemDescription>
                    {[invitation.organization.typeLabel, roleLabels(invitation.roles)]
                      .filter(Boolean)
                      .join(" · ")}
                  </ListItemDescription>
                  <ListItemDescription>
                    Sent to {invitation.email ?? invitation.phone ?? "you"}
                    {expires ? ` · expires ${expires}` : ""}
                  </ListItemDescription>
                </Stack>
              </ListItemContent>
              <ListItemAction>
                <Stack dir="row" gap={8}>
                  {invitation.requiresConsent ? (
                    <Button
                      data-testid={`pending-invitation-${invitation.id}-review`}
                      scale="sm"
                      onClick={() => onReview(invitation.id)}
                    >
                      Review &amp; accept
                    </Button>
                  ) : (
                    <Button
                      data-testid={`pending-invitation-${invitation.id}-accept`}
                      scale="sm"
                      onClick={() => void run(() => client.acceptInvitation(invitation.id))}
                    >
                      Accept
                    </Button>
                  )}
                  <Button
                    data-testid={`pending-invitation-${invitation.id}-reject`}
                    emphasis="secondary"
                    scale="sm"
                    onClick={() => void run(() => client.rejectInvitation(invitation.id))}
                  >
                    Decline
                  </Button>
                </Stack>
              </ListItemAction>
            </ListItem>
          );
        })}
      </List>
      {error && (
        <StatusAlert status="error" testId="pending-invitations-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
