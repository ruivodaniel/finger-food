/**
 * InvitationsList — an org's invitations with status and a revoke action for
 * pending ones.
 *
 * A List: each invitation a row — a mail Tile · the identifier (the title)
 * over the roles offered · the status as a dot + text and Revoke as the row
 * actions. EmptyState when there are none; errors as an Alert.
 *
 * AC(availability-check): invitation.revoke — the revoke action renders for
 * every member until availability-check narrows visibility from the engine's
 * rules.
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
import type { InvitationView } from "../../../shared/types/domain";
import { EmptyState } from "../EmptyState";
import { StatusAlert } from "../StatusAlert";

export interface InvitationsListProps {
  /** The org whose invitations these are — the shown org, not the active one. */
  organizationId: string;
  orgType: string | undefined;
  invitations: InvitationView[];
  onChanged: () => void;
}

/** The status axis a row's status text wears; revoked stays neutral. */
const STATUS_AXIS: Record<InvitationView["status"], "warning" | "success" | "error" | undefined> = {
  pending: "warning",
  accepted: "success",
  rejected: "error",
  revoked: undefined,
};

export function InvitationsList({
  organizationId,
  orgType,
  invitations,
  onChanged,
}: InvitationsListProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const roleLabels = useRoleLabels(orgType);
  const [error, setError] = React.useState<string | null>(null);

  const revoke = async (invitationId: string) => {
    setError(null);
    try {
      await client.revokeInvitation(organizationId, invitationId);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    }
  };

  return (
    <Stack dir="col" gap={12} data-testid="invitations-list">
      {invitations.length === 0 ? (
        <EmptyState
          kind="nothing-yet"
          testId="invitations-empty"
          icon="mail"
          title="No invitations"
          description="Invite someone from the toolbar; the invitation shows up here."
        />
      ) : (
        <List position="fill">
          {invitations.map((invitation) => (
            <ListItem key={invitation.id} data-testid={`invitation-${invitation.id}`}>
              <ListItemIcon>
                <Tile emphasis="quiet">
                  <Icon name="mail" size="sm" />
                </Tile>
              </ListItemIcon>
              <ListItemContent>
                <Stack dir="col" gap={2}>
                  <ListItemTitle>{invitation.email ?? invitation.phone}</ListItemTitle>
                  <ListItemDescription data-testid={`invitation-${invitation.id}-roles`}>
                    {roleLabels(invitation.roles)}
                  </ListItemDescription>
                </Stack>
              </ListItemContent>
              <ListItemAction>
                <Stack dir="row" align="center" gap={12}>
                  <span
                    element="type--body-small"
                    emphasis={STATUS_AXIS[invitation.status] ? undefined : "quiet"}
                    status={STATUS_AXIS[invitation.status]}
                    data-testid={`invitation-${invitation.id}-status`}
                  >
                    <Icon name="dot" size="xs" /> {invitation.status}
                  </span>
                  {invitation.status === "pending" && (
                    <Button
                      data-testid={`invitation-${invitation.id}-revoke`}
                      emphasis="secondary"
                      scale="sm"
                      onClick={() => void revoke(invitation.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </Stack>
              </ListItemAction>
            </ListItem>
          ))}
        </List>
      )}
      {error && (
        <StatusAlert status="error" testId="invitations-list-error">{error}</StatusAlert>
      )}
    </Stack>
  );
}
