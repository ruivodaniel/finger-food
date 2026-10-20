/**
 * App navigation — the sidebar's entries as data. An entry that names
 * `requiredRoles` is shown only to a caller whose active membership holds one
 * of them — effective roles, inheritance included (useMemberRoles). An entry
 * without them is visible to every signed-in user. The server enforces either
 * way.
 *
 * Two lists: the main shell sidebar (product areas) and the settings
 * section's own left panel (/my/settings/*, reached via the user menu —
 * settings entries never sit in the main sidebar).
 */

import type { IconName } from "@libs/web-components";

export interface AppNavEntry {
  id: string;
  title: string;
  icon: IconName;
  to: string;
  /** Roles of the active membership that may see this entry (any of them). Empty/absent = everyone. */
  requiredRoles?: string[];
}

/** No requiredRoles → everyone; otherwise any one of them. */
export function visibleTo(roles: readonly string[]) {
  return (entry: AppNavEntry): boolean =>
    !entry.requiredRoles?.length ||
    entry.requiredRoles.some((role) => roles.includes(role));
}

export const NAV_ENTRIES: AppNavEntry[] = [
  { id: "dashboard", title: "Home", icon: "home", to: "/dashboard" },
  {
    // The active organization's own management area — for a membership that
    // can manage it (company_manager · manage_platform · manage_system,
    // inheritance included). "current" is the active org.
    id: "manage-organization",
    title: "Manage organization",
    icon: "cog",
    to: "/organizations/current/info",
    requiredRoles: ["company_manager", "manage_platform", "manage_system"],
  },
  {
    // AC(scoped-ac): organization.read — the engine's availability check
    // gates this entry (the platform directory) when it lands.
    id: "organizations",
    title: "Organizations",
    icon: "users",
    to: "/organizations",
  },
  {
    // Legal documents are authored by the platform's manage_legal_docs role;
    // platform_owner inherits it. Everyone else never sees the entry.
    id: "legal-documents",
    title: "Legal documents",
    icon: "fileText",
    to: "/manage-legal-documents",
    requiredRoles: ["manage_legal_docs"],
  },
];

/** The settings section's second left panel (SettingsLayout). */
export const SETTINGS_NAV_ENTRIES: AppNavEntry[] = [
  { id: "account", title: "Account", icon: "mail", to: "/my/settings/account" },
  { id: "profile", title: "Profile", icon: "user", to: "/my/settings/profile" },
  {
    id: "security",
    title: "Security",
    icon: "lock",
    to: "/my/settings/security",
  },
  {
    id: "legal",
    title: "Legal agreements",
    icon: "bookOpen",
    to: "/my/settings/legal",
  },
  {
    id: "preferences",
    title: "Preferences",
    icon: "settings",
    to: "/my/settings/preferences",
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: "bell",
    to: "/my/settings/notifications",
  },
];
