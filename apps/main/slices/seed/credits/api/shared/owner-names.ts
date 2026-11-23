/**
 * Owner names — the name of an organization or of a person. Both belong to
 * the user-organization slice: the app hands its services in at mount, and
 * names are read and searched through them.
 */

import { PRIVATE, PUBLIC, type ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { OrganizationService, UserProfileService } from "@modules/user-organization-mgmt/api";
import type { OwnerOption } from "../../shared/types";

/** The user-organization slice's services that name organizations and people. */
export interface People {
  organization: Pick<OrganizationService, "namesByIds" | "searchByName">;
  userProfile: Pick<UserProfileService, "namesByIds" | "searchByName">;
}

const SEARCH_LIMIT = 10;

/** Whether the organization or the person exists — what a grant's recipient must. */
export async function ownerExists(people: People, owner: { organizationId: string } | { userId: string }): Promise<boolean> {
  const found = "organizationId" in owner
    ? await people.organization.namesByIds(PUBLIC, [owner.organizationId])
    : await people.userProfile.namesByIds(PUBLIC, [owner.userId]);
  return found.size > 0;
}

/** One lookup for many rows, deduplicated; a missing name falls back to the id. */
export async function lookUpNames(people: People, refs: { organizationIds?: string[]; userIds?: string[] }): Promise<(id: string) => string> {
  const [organizations, users] = await Promise.all([
    people.organization.namesByIds(PUBLIC, [...new Set(refs.organizationIds ?? [])]),
    people.userProfile.namesByIds(PUBLIC, [...new Set(refs.userIds ?? [])]),
  ]);
  return (id: string) => organizations.get(id) ?? users.get(id) ?? id;
}

/** Credit owners whose name contains `search`: organizations, then people —
 *  only those the caller may read, which the user-organization slice decides. */
export async function searchOwners(people: People, ac: ScopedAcRequestContext, search: string): Promise<OwnerOption[]> {
  const [organizations, users] = await Promise.all([
    people.organization.searchByName(ac, PRIVATE, search, SEARCH_LIMIT),
    people.userProfile.searchByName(ac, PRIVATE, search, SEARCH_LIMIT),
  ]);
  return [
    ...organizations.map((o) => ({ owner: { organizationId: o.id }, name: o.name, kind: "organization" as const })),
    ...users.map((u) => ({ owner: { userId: u.userId }, name: u.name, kind: "person" as const })),
  ];
}
