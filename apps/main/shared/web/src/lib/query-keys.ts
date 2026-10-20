/**
 * Query Key Factory
 *
 * Centralized query keys for TanStack Query.
 * All queries MUST use keys from this factory to ensure:
 * - Consistent cache invalidation
 * - No duplicate fetches from key mismatches
 * - Easy debugging
 *
 * @see docs/seed/10-TANSTACK-QUERY-DISCIPLINE.md
 */

export const queryKeys = {
  // Session & Auth
  session: {
    current: ["session"] as const,
  },

  // Organizations
  organizations: {
    all: ["organizations"] as const,
    list: (query?: Record<string, unknown>) =>
      [...queryKeys.organizations.all, "list", query] as const,
    detail: (id: string) => ["organization", id] as const,
    members: (id: string) =>
      [...queryKeys.organizations.all, id, "members"] as const,
    invitations: (id: string, search?: string) =>
      [...queryKeys.organizations.all, id, "invitations", search] as const,
  },

  // Active organization (from BetterAuth)
  activeOrganization: {
    current: ["activeOrganization"] as const,
  },

  // Member roles (for sidebar filtering)
  members: {
    scopedRoles: (orgId: string) => ["member-scoped-roles", orgId] as const,
  },

  // User preferences
  userPreferences: {
    current: ["userPreferences"] as const,
  },

  // Invitations
  invitations: {
    detail: (id: string) => ["invitationDetails", id] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;

