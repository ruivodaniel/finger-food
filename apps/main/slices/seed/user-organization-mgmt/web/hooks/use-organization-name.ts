import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { useResolvedOrgId } from "./use-resolved-org-id";
import { queryKeys } from "../lib/query-keys";

/**
 * The name of the organization a URL names (an id, or `current` for the session's
 * active org). Shares the page's query: an id the active org's context can't read
 * 404s by design, so it never retries.
 */
export function useOrganizationName(organizationId: string): string | undefined {
  const { client } = useUserOrgMgmtContext();
  const { orgId } = useResolvedOrgId(organizationId);
  const { data: org } = useQuery({
    queryKey: queryKeys.organization(orgId),
    queryFn: () => client.getOrganization(orgId!),
    enabled: !!orgId,
    retry: false,
  });
  return org?.name;
}
