/**
 * useActiveMembership — the caller's membership in the session's active
 * organization (id + org type + roles), or null when no org is targeted.
 * The facts ride the session, so nav can filter on first paint with no
 * second fetch.
 */

import { useSession } from "./use-session";
import type { MembershipFacts } from "../../shared/types/domain";

export function useActiveMembership(): MembershipFacts | null {
  const { data } = useSession();
  const session = data?.session;
  if (!session?.activeOrganizationId) return null;
  return (
    session.memberships.find(
      (m) => m.organizationId === session.activeOrganizationId,
    ) ?? null
  );
}
