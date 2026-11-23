/**
 * Owner names — the name of an organization (a vendor, a buying company) or
 * of a person (a buyer). Both belong to the user-organization slice: the app
 * hands its services in at mount, and names are read through them.
 *
 * Who sees a name is the route's business: the Marketplace names every
 * vendor; a vendor's sales name their buyers; a billing page names the
 * vendors its owner bought from.
 */

import { PUBLIC } from "@libs/gated-scoped-ac";
import type { OrganizationService, UserProfileService } from "@modules/user-organization-mgmt/api";

/** The user-organization slice's services that name organizations and people. */
export interface People {
  organization: Pick<OrganizationService, "namesByIds">;
  userProfile: Pick<UserProfileService, "namesByIds">;
}

/** Whether the organization or the person exists — what a promotion's recipient must. */
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
