/**
 * OrgInfoPage — /organizations/:organizationId|current/info. One org's
 * identity card (logo + name). The URL names the org (`current` aliases the
 * session's active org) and every request carries that id in its path —
 * VIEWING an org never activates it. The server answers from the active
 * org's context, so an org that context can't read is a 404 and the page
 * states that instead of masquerading as an empty org.
 * Requires a session.
 *
 * The org's name and the section nav are the org layout's (the hosting app
 * mounts it around the page), so the page renders neither; inside, an intro
 * line and the Details card. The two "nothing to show" branches are
 * EmptyStates. Layout is Stack; no inline styles.
 */

import { EmptyState, Icon, Text } from "@libs/web-components";
import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useResolvedOrgId } from "../../shared/hooks/use-resolved-org-id";
import { OrgInfoCard } from "./components/OrgInfoCard";
import { authenticationService } from "../../services/application/authentication.service";
import { organizationsService } from "../../services/application/organizations.service";
import { membershipsService } from "../../services/application/memberships.service";
import { mounted } from "../../services/application/mount";

export interface OrgInfoPageProps {
  organizationId: string;
  loginPath?: string;
}

export function OrgInfoPage({
  organizationId,
  loginPath = "/login",
}: OrgInfoPageProps): React.ReactElement | null {
  const { router } = mounted();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useQuery(authenticationService.getSession());
  const { orgId, isCurrent, isResolving } = useResolvedOrgId(organizationId);

  const {
    data: org,
    isError,
  } = useQuery({
    ...organizationsService.getOrganization(orgId),
    enabled: !!orgId,
    // An id the active org's context can't read 404s by design —
    // fail fast into the "not available" state instead of retrying.
    retry: false,
  });

  React.useEffect(() => {
    if (!sessionLoading && !sessionData?.session) {
      void router?.navigate({ to: loginPath });
    }
  }, [sessionLoading, sessionData, router, loginPath]);

  if (sessionLoading || !sessionData?.session) return null;

  if (isCurrent && !isResolving && !orgId) {
    return (
      <Stack dir="col" scale="xl" data-testid="org-info-page">
        <EmptyState emphasis="quiet"
          icon={<Icon name="building" />}
          title="No active organization"
          description={
            <Text data-testid="no-active-org">
              You're not in any organization yet — create or join one from Organizations.
            </Text>
          }
        />
      </Stack>
    );
  }
  if (!orgId) return null;

  if (isError) {
    return (
      <Stack dir="col" scale="xl" data-testid="org-info-page">
        <EmptyState emphasis="quiet"
          icon={<Icon name="building" />}
          title="Organization not available"
          description={
            <Text data-testid="org-not-available">
              This organization doesn't exist, or you're not a member of it.
            </Text>
          }
        />
      </Stack>
    );
  }

  return (
    <Stack dir="col" scale="xl" data-testid="org-info-page">
      <Text type="body-small" emphasis="quiet">
        The organization's logo and name, as its members see them. Changes apply when you save.
      </Text>

      <OrgInfoCard
        organizationId={orgId}
        org={org}
        onChanged={() => {
          // The name and logo show beyond this page: the switcher and My
          // memberships (memberships) and the directory.
          void queryClient.invalidateQueries({ queryKey: organizationsService.keys.organization(orgId) });
          void queryClient.invalidateQueries({ queryKey: membershipsService.keys.memberships });
          void queryClient.invalidateQueries({ queryKey: ["uom", "organizations-directory"] });
        }}
      />
    </Stack>
  );
}
