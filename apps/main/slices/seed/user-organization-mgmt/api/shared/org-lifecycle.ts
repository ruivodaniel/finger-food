/**
 * Reading the org-lifecycle config — how an org type is created and joined.
 *
 * The config is a LIST keyed by `orgType`, and three services need to reach
 * into it. Two intents, and the difference matters:
 *
 *   requireOrgLifecycle — the org type came from a request, so an unknown one
 *     is the caller's mistake: it throws 400. Use it before ACTING on a type.
 *
 *   findOrgLifecycle — the org type came from a row we already trust, and the
 *     caller only wants to read a detail off it. A type that no longer appears
 *     in the config (removed after orgs of it existed) must not break a read,
 *     so this answers undefined and the caller falls back.
 */

import type { OrgLifecycleEntry } from "../../shared/auth-config/types";
import type { ModuleErrors } from "./module-errors";

/** The type's lifecycle rules, or undefined when the config doesn't declare it. */
export function findOrgLifecycle(
  orgConfig: OrgLifecycleEntry[],
  orgType: string,
): OrgLifecycleEntry | undefined {
  return orgConfig.find((entry) => entry.orgType === orgType);
}

/** The type's lifecycle rules; an org type the config doesn't declare is a 400. */
export function requireOrgLifecycle(
  orgConfig: OrgLifecycleEntry[],
  orgType: string,
  errors: ModuleErrors,
): OrgLifecycleEntry {
  const entry = findOrgLifecycle(orgConfig, orgType);
  if (!entry) throw errors.badRequest("unknown organization type");
  return entry;
}

/** The type's human label, falling back to the raw type for a stale one. */
export function orgTypeLabel(
  orgConfig: OrgLifecycleEntry[],
  orgType: string,
): string {
  return findOrgLifecycle(orgConfig, orgType)?.label ?? orgType;
}
