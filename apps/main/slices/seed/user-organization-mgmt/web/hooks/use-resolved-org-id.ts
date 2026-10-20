/**
 * useResolvedOrgId — turns an org-route param into a concrete org id. The
 * literal segment `current` is a FRONTEND alias for the session's active org
 * (the backend never sees it — requests carry the resolved id in their
 * path); any other value is already an id. Resolving
 * never writes the active-org store: visiting an org is not activating it.
 */

import { useSession } from "./use-session";

export interface ResolvedOrgId {
  /** null while `current` is unresolved (no session yet, or no active org). */
  orgId: string | null;
  isCurrent: boolean;
  /** True while the session lookup that `current` depends on is in flight. */
  isResolving: boolean;
}

export function useResolvedOrgId(param: string): ResolvedOrgId {
  const { data: sessionData, isLoading } = useSession();
  if (param !== "current") {
    return { orgId: param, isCurrent: false, isResolving: false };
  }
  return {
    orgId: sessionData?.session?.activeOrganizationId ?? null,
    isCurrent: true,
    isResolving: isLoading,
  };
}
