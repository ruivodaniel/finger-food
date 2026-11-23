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
import { Button, Icon, List, ListItem, ListItemAction, ListItemContent, ListItemDescription, ListItemIcon, ListItemTitle, Tile, Alert, AlertDescription } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { mounted } from "../../../services/application/mount";
import { roleLabels as labelsFor } from "../../../shared/helpers/role-labels";
import type { MyInvitationView } from "../../../../shared/types/domain";
import { invitationsService } from "../../../services/application/invitations.service";
import { isApiError } from "../../../shared/helpers/api-error";

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
  const roleLabels = labelsFor(mounted().roleCatalog);
  const [error, setError] = React.useState<string | null>(null);

  if (invitations.length === 0) return null;

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(isApiError(e) ? e.message : "something went wrong");
    }
  };

  return (
    <Stack dir="col" scale="md" data-testid="pending-invitations">
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
                  <Icon name="mail" scale="sm" />
                </Tile>
              </ListItemIcon>
              <ListItemContent>
                <Stack dir="col" scale="3xs">
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
                <Stack dir="row" scale="sm">
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
                      onClick={() => void run(() => invitationsService.acceptInvitation(invitation.id))}
                    >
                      Accept
                    </Button>
                  )}
                  <Button
                    data-testid={`pending-invitation-${invitation.id}-reject`}
                    emphasis="secondary"
                    scale="sm"
                    onClick={() => void run(() => invitationsService.rejectInvitation(invitation.id))}
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
        <Alert status="error" data-testid="pending-invitations-error"><AlertDescription>{error}</AlertDescription></Alert>
      )}
    </Stack>
  );
}
