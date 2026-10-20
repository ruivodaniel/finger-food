/**
 * useMemberRoles — the caller's effective roles in the active organization:
 * the membership's assigned roles plus every role they imply in the
 * access-control forests (an owner holds manage_legal_docs without being
 * assigned it). Off the session — no request per check. Nav gating reads it;
 * the server enforces either way.
 */

import { useMemo } from "react";
import { useActiveMembership } from "@modules/user-organization-mgmt/web";
import { rolesImpliedBy } from "@configs/access-control";

export function useMemberRoles(): string[] {
  const membership = useActiveMembership();
  return useMemo(() => rolesImpliedBy(membership?.roles ?? []), [membership]);
}
