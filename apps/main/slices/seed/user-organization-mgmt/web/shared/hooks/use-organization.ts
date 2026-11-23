import { useQuery } from "@tanstack/react-query";
import { useResolvedOrgId } from "./use-resolved-org-id";
import { organizationsService } from "../../services/application/organizations.service";
import type { OrganizationView } from "../../../shared/types/domain";

/**
 * The organization a URL names (an id, or `current` for the session's active
 * org). Shares the page's query: an id the active org's context can't read
 * 404s by design, so it never retries.
 */
export function useOrganization(organizationId: string): OrganizationView | undefined {
  const { orgId } = useResolvedOrgId(organizationId);
  const { data: org } = useQuery({
    ...organizationsService.getOrganization(orgId),
    enabled: !!orgId,
    retry: false,
  });
  return org;
}
