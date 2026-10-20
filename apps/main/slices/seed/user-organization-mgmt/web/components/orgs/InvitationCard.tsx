/**
 * InvitationCard — one invitation from its masked public view: the
 * inviting org as a monogram row (logo or initials, name, org type) over who
 * was invited as which roles. Shared by the public capability URL and the
 * signed-in accept page; each page states the invitation's status itself.
 */

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useComponents } from "../../hooks/use-components";
import { useRoleLabels } from "../../hooks/use-role-labels";

import type { InvitationPublicView } from "../../../shared/types/domain";
import { StatusAlert } from "../StatusAlert";

export interface InvitationCardProps {
  /** Undefined while loading. */
  invitation: InvitationPublicView | undefined;
}

export function InvitationCard({
  invitation,
}: InvitationCardProps): React.ReactElement {
  const { OrganizationAvatar } = useComponents();
  const roleLabels = useRoleLabels(invitation?.orgType);

  if (!invitation) {
    return (
      <span element="type--body-small" emphasis="quiet">
        Loading…
      </span>
    );
  }

  return (
    <Stack dir="row" align="center" gap={12}>
      <OrganizationAvatar
        name={invitation.organizationName}
        image={invitation.organizationLogo}
        scale="lg"
        testId="invitation-org-logo"
      />
      <Stack dir="col" gap={2} size="fill">
        <span element="type--heading4">{invitation.organizationName}</span>
        <span element="type--body-small" emphasis="quiet">
          {invitation.orgTypeLabel}
        </span>
        <span element="type--body-small">
          Invited {invitation.identifier} to join as {roleLabels(invitation.roles)}.
        </span>
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
    <StatusAlert status="warning" testId="invitation-not-pending">
        This invitation is no longer available ({status}).
      </StatusAlert>
  );
}
