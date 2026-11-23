/**
 * App navigation — the sidebar's entries as data. An entry that names
 * `requiredRoles` is shown only to a caller whose active membership holds one
 * of them — effective roles, inheritance included (useMemberRoles). An entry
 * without them is visible to every signed-in user. The server enforces either
 * way.
 *
 * One list: the main shell sidebar (product areas). A section's own panel
 * (the settings, an organization) is the slice's: its layout draws it from
 * its route declaration.
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

/** Where a signed-in caller lands: after sign-in, from the sidebar's home entry, from an access-denied page. The page there is a slice's. */
export const SIGNED_IN_HOME = "/";

export const NAV_ENTRIES: AppNavEntry[] = [
  { id: "dashboard", title: "Home", icon: "home", to: SIGNED_IN_HOME },
  // The assistant answers from the data the user already has access to.
  { id: "assistant", title: "Assistant", icon: "bot", to: "/chat" },
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
    // The implementation patterns, kept as reference: the meteors (the default data flow) and the minesweeper (the
    // slice store). Every member sees the meteors and edits them; the server enforces.
    id: "implementation-patterns",
    title: "Implementation patterns",
    icon: "activity",
    to: "/implementation-patterns",
  },
  {
    // The active organization's money (payment slice) — Manage Billing,
    // which company_owner inherits. `current` is the active organization.
    // The credits page offers "Buy credits" to whoever sees this entry.
    id: "billing",
    title: "Billing",
    icon: "tag",
    to: "/organizations/current/billing",
    requiredRoles: ["company_billing"],
  },
  {
    // The active organization's credits (credits slice) — every member: who
    // manages them sees the lots, every member's limit and the history;
    // everyone else what they may spend. The server enforces.
    id: "credits",
    title: "Credits",
    icon: "activity",
    to: "/organizations/current/credits",
  },
  {
    // Every product of every vendor (payment slice); anyone signed in may look.
    id: "marketplace",
    title: "Marketplace",
    icon: "grid",
    to: "/marketplace",
  },
  {
    // The active organization as a vendor (payment slice) — Manage Billing.
    id: "selling",
    title: "Selling",
    icon: "package",
    to: "/organizations/current/selling",
    requiredRoles: ["company_billing"],
  },
  {
    // Platform credits given without payment (credits slice) — the Platform Owner's.
    id: "credit-grants",
    title: "Credit grants",
    icon: "star",
    to: "/manage-credits",
    requiredRoles: ["platform_owner"],
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
