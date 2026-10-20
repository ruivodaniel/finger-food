/**
 * Navigation Config
 *
 * Declares the full sidebar nav tree as pure data.
 * The app shell reads this, resolves icons and i18n, and renders.
 *
 * Ordering is array order. Access gates (requiredRoles, requiredOrgTypes)
 * are evaluated at render time by the shell's role/org-type filter.
 *
 * Path tokens use the same `$session.*` syntax as AC rules and wizard
 * assertions — e.g. `$session.organization.id`. The shell resolves them
 * from the active session before navigating.
 */

export interface NavEntryConfig {
  id: string;
  labelKey: string;
  icon: string;
  path: string;
  uid: string;
  requiredRoles: string[];
  requiredOrgTypes?: string[];
  fuzzyMatch?: boolean;
}

export const NAVIGATION: NavEntryConfig[] = [
  {
    id: "dashboard",
    labelKey: "common.home",
    icon: "home",
    path: "/dashboard",
    uid: "nav-dashboard",
    requiredRoles: [],
    requiredOrgTypes: [],
  },

  // --- Admin scope (system_admin / platform_admin) ---
  {
    id: "organizations",
    labelKey: "common.organizations",
    icon: "network",
    path: "/organizations",
    uid: "nav-organizations",
    requiredRoles: [],
    requiredOrgTypes: ["system_admin", "platform_admin"],
  },
  {
    id: "users",
    labelKey: "common.Users",
    icon: "users",
    path: "/organizations/$session.organization.id/members",
    uid: "nav-members",
    requiredRoles: [],
  },
  {
    id: "legal-documents",
    labelKey: "common.legalDocuments",
    icon: "file-text",
    path: "/manage-legal-documents",
    uid: "nav-legal-documents",
    requiredRoles: ["manage_legal_docs"],
    // requiredOrgTypes: ["platform_admin"],
  },
  {
    id: "system-settings",
    labelKey: "common.settings",
    icon: "settings",
    path: "/organizations/$session.organization.id/info",
    uid: "nav-settings",
    requiredRoles: ["view_system"],
    requiredOrgTypes: ["system_admin", "platform_admin"],
  },

  // --- Regular organization scope (company) ---
  {
    id: "team",
    labelKey: "common.team",
    icon: "users",
    path: "/organizations/$session.organization.id/members",
    uid: "nav-members",
    requiredRoles: ["view_org_users"],
    requiredOrgTypes: ["company"],
  },
  {
    id: "my-organization",
    labelKey: "common.myOrganization",
    icon: "briefcase",
    path: "/organizations/$session.organization.id/info",
    uid: "nav-settings",
    requiredRoles: ["view_org"],
    requiredOrgTypes: ["company"],
  },

  // --- App features ---
  {
    id: "notes",
    labelKey: "Notes",
    icon: "notebook",
    path: "/notes",
    uid: "nav-notes",
    requiredRoles: [],
    requiredOrgTypes: ["company"],
  },
] as const;
