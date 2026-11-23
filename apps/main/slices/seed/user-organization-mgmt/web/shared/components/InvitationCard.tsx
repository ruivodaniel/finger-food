/**
 * InvitationCard — one invitation from its masked public view: the
 * inviting org as a monogram row (logo or initials, name, org type) over who
 * was invited as which roles. Shared by the public capability URL and the
 * signed-in accept page; each page states the invitation's status itself.
 */

import { Alert, AlertDescription, Avatar, AvatarFallback, AvatarImage, Text } from "@libs/web-components";
import { initialsOf } from "../helpers/initials";
import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { mounted } from "../../services/application/mount";
import { roleLabels as labelsFor } from "../helpers/role-labels";

import type { InvitationPublicView } from "../../../shared/types/domain";

export interface InvitationCardProps {
  /** Undefined while loading. */
  invitation: InvitationPublicView | undefined;
}

export function InvitationCard({
  invitation,
}: InvitationCardProps): React.ReactElement {
  const roleLabels = labelsFor(mounted().roleCatalog, invitation?.orgType);

  if (!invitation) {
    return (
      <Text type="body-small" emphasis="quiet">
        Loading…
      </Text>
    );
  }

  return (
    <Stack dir="row" align="center" scale="md">
      <Avatar scale="lg" data-testid="invitation-org-logo">
        {invitation.organizationLogo && <AvatarImage src={invitation.organizationLogo} alt="" />}
        <AvatarFallback>{initialsOf(invitation.organizationName)}</AvatarFallback>
      </Avatar>
      <Stack dir="col" scale="3xs" size="fill">
        <Text type="heading4">{invitation.organizationName}</Text>
        <Text type="body-small" emphasis="quiet">
          {invitation.orgTypeLabel}
        </Text>
        <Text type="body-small">
          Invited {invitation.identifier} to join as {roleLabels(invitation.roles)}.
        </Text>
      </Stack>
    </Stack>
  );
}

/** The warning a page shows for an invitation that is no longer pending. */
export function InvitationNotPendingAlert({
  status,
}: {
  status: string;
}): React.ReactElement {
  return (
    <Alert status="warning" data-testid="invitation-not-pending"><AlertDescription>
        This invitation is no longer available ({status}).
      </AlertDescription></Alert>
  );
}
