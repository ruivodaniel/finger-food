// Module query-key catalog — one place, so invalidation never drifts.

export const queryKeys = {
  session: ["uom", "session"] as const,
  me: ["uom", "me"] as const,
  preferences: ["uom", "preferences"] as const,
  gate: ["uom", "gate"] as const,
  security: ["uom", "security"] as const,
  authConfig: (intent: string, identifier?: string) =>
    ["uom", "auth-config", intent, identifier ?? null] as const,
  memberships: ["uom", "memberships"] as const,
  creatableOrgTypes: ["uom", "creatable-org-types"] as const,
  organizationTypes: ["uom", "organization-types"] as const,
  myInvitations: ["uom", "my-invitations"] as const,
  // Keyed by the SHOWN org id — the visited org, which may or may not be the
  // active one (null while "current" is still resolving). A different id
  // re-keys and refetches.
  organization: (orgId: string | null) =>
    ["uom", "organization", orgId] as const,
  organizationsDirectory: (query: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
  }) =>
    [
      "uom",
      "organizations-directory",
      query.search ?? "",
      query.type ?? "",
      query.status ?? "",
      query.page ?? 1,
    ] as const,
  orgMembers: (
    orgId: string | null,
    query?: { search?: string; page?: number },
  ) =>
    ["uom", "org-members", orgId, query?.search ?? "", query?.page ?? 1] as const,
  // Prefix of every orgMembers key for one org — invalidates all its
  // search/page variants at once.
  orgMembersRoot: (orgId: string | null) =>
    ["uom", "org-members", orgId] as const,
  orgInvitations: (orgId: string | null) =>
    ["uom", "org-invitations", orgId] as const,
  invitation: (id: string) => ["uom", "invitation", id] as const,
  legalDocument: (type: string, orgTypeId?: string | null) =>
    ["uom", "legal-document", type, orgTypeId ?? null] as const,
  legalDocumentById: (id: string) =>
    ["uom", "legal-document-by-id", id] as const,
  pendingConsents: ["uom", "pending-consents"] as const,
  consentHistory: ["uom", "consent-history"] as const,
  legalCatalog: ["uom", "legal-catalog"] as const,
  legalVersions: (type: string, orgTypeId: string | null) =>
    ["uom", "legal-versions", type, orgTypeId] as const,
};
