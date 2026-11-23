/** Organizations: one org's info, the directory, the types, creating one. */

import { queryOptions } from "@tanstack/react-query";
import { myOrganizationsApi } from "../api/my-organizations.api";
import { organizationApi } from "../api/organization.api";

type DirectoryQuery = { search?: string; type?: string; status?: string; page?: number; pageSize?: number };

const keys = {
  creatableOrgTypes: ["uom", "creatable-org-types"] as const,
  organizationTypes: ["uom", "organization-types"] as const,
  // Keyed by the SHOWN org id — the visited org, which may or may not be the
  // active one (null while "current" is still resolving). A different id
  // re-keys and refetches.
  organization: (orgId: string | null) => ["uom", "organization", orgId] as const,
  organizationsDirectory: (query: { search?: string; type?: string; status?: string; page?: number }) =>
    ["uom", "organizations-directory", query.search ?? "", query.type ?? "", query.status ?? "", query.page ?? 1] as const,
};

export const organizationsService = {
  keys,
  /** Pair with `enabled: !!orgId` — null means "current" hasn't resolved yet. */
  getOrganization: (orgId: string | null) =>
    queryOptions({ queryKey: keys.organization(orgId), queryFn: () => organizationApi.getOrganization(orgId!) }),
  listOrganizations: (query: DirectoryQuery) =>
    queryOptions({
      queryKey: keys.organizationsDirectory(query),
      queryFn: () => organizationApi.listOrganizationsDirectory(query),
    }),
  getOrganizationTypes: () =>
    queryOptions({ queryKey: keys.organizationTypes, queryFn: () => organizationApi.getOrganizationTypes() }),
  getCreatableTypes: () =>
    queryOptions({ queryKey: keys.creatableOrgTypes, queryFn: () => myOrganizationsApi.getCreatableOrganizationTypes() }),
  createOrganization: organizationApi.createOrganization,
  updateOrganization: organizationApi.updateOrganization,
  presignLogoUpload: organizationApi.presignOrgLogoUpload,
};
