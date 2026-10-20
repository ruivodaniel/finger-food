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

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { useResolvedOrgId } from "../../hooks/use-resolved-org-id";
import { queryKeys } from "../../lib/query-keys";
import { OrgInfoCard } from "../../components/orgs/OrgInfoCard";
import { EmptyState } from "../../components/EmptyState";

export interface OrgInfoPageProps {
  organizationId: string;
  loginPath?: string;
}

export function OrgInfoPage({
  organizationId,
  loginPath = "/login",
}: OrgInfoPageProps): React.ReactElement | null {
  const { client, router } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading: sessionLoading } = useSession();
  const { orgId, isCurrent, isResolving } = useResolvedOrgId(organizationId);

  const {
    data: org,
    isError,
  } = useQuery({
    queryKey: queryKeys.organization(orgId),
    queryFn: () => client.getOrganization(orgId!),
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
      <Stack dir="col" gap={24} data-testid="org-info-page" className="w-full max-w-2xl">
        <EmptyState
          kind="unavailable"
          icon="building"
          title="No active organization"
          description={
            <span data-testid="no-active-org">
              You're not in any organization yet — create or join one from Organizations.
            </span>
          }
        />
      </Stack>
    );
  }
  if (!orgId) return null;

  if (isError) {
    return (
      <Stack dir="col" gap={24} data-testid="org-info-page" className="w-full max-w-2xl">
        <EmptyState
          kind="unavailable"
          icon="building"
          title="Organization not available"
          description={
            <span data-testid="org-not-available">
              This organization doesn't exist, or you're not a member of it.
            </span>
          }
        />
      </Stack>
    );
  }

  return (
    <Stack dir="col" gap={24} data-testid="org-info-page" className="w-full max-w-2xl">
      <span element="type--body-small" emphasis="quiet">
        The organization's logo and name, as its members see them. Changes apply when you save.
      </span>

      <OrgInfoCard
        organizationId={orgId}
        org={org}
        onChanged={() => {
          // The name and logo show beyond this page: the switcher and My
          // memberships (memberships) and the directory.
          void queryClient.invalidateQueries({ queryKey: queryKeys.organization(orgId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.memberships });
          void queryClient.invalidateQueries({ queryKey: ["uom", "organizations-directory"] });
        }}
      />
    </Stack>
  );
}
