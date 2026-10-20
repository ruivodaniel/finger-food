// =============================================================================
// UX PATTERN: Hide Navigation Item When Unauthorized
// =============================================================================
//
// Use Case: Sidebar/navbar items that should not appear at all if user
// lacks the required role.
//
// Decision: If not authorized → don't render the item
//
// =============================================================================

import { resolveAvailability } from "@libs/availability-check";
// In real app: import { fromScope } from '@/lib/availability';
import { createFromScope } from "@libs/availability-check";

// --- Mock setup (in real app, this comes from your config) ---
const scopedRoles = {
  view_org: { title: "View Org", coreRole: "view-orgs" },
  manage_org: { title: "Manage Org", coreRole: "manage-orgs", implies: ["view_org"] },
  system_admin: { title: "System Admin", coreRole: "system-admin" },
};
const fromScope = createFromScope(scopedRoles);

// --- Navigation item definition ---
interface NavItem {
  id: string;
  label: string;
  href: string;
  requiredRoles: string[];
}

const allNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", requiredRoles: [] },
  { id: "org-settings", label: "Organization Settings", href: "/settings", requiredRoles: ["manage_org"] },
  { id: "admin-panel", label: "Admin Panel", href: "/admin", requiredRoles: ["system_admin"] },
];

// --- The pattern: Filter out unavailable items ---

/**
 * Filter navigation items based on user's roles.
 * Items without required roles are hidden entirely.
 */
function filterNavItems(items: NavItem[], memberRoles: string[]): NavItem[] {
  return items.filter((item) => {
    // No roles required = always visible
    if (item.requiredRoles.length === 0) {
      return true;
    }

    // Check availability
    const availability = resolveAvailability([
      fromScope(memberRoles, item.requiredRoles),
    ]);

    // UX Decision: HIDE if not available
    return availability.available;
  });
}

// --- Example usage ---

export function exampleHidePattern() {
  // User with only view_org role
  const memberRoles = ["view_org"];

  const visibleItems = filterNavItems(allNavItems, memberRoles);

  console.log("Visible items for user with view_org:");
  console.log(visibleItems.map((item) => item.label));
  // Output: ["Dashboard"]
  // "Organization Settings" hidden (needs manage_org)
  // "Admin Panel" hidden (needs system_admin)

  // User with manage_org role
  const adminRoles = ["manage_org"];

  const adminVisibleItems = filterNavItems(allNavItems, adminRoles);

  console.log("\nVisible items for user with manage_org:");
  console.log(adminVisibleItems.map((item) => item.label));
  // Output: ["Dashboard", "Organization Settings"]
  // "Admin Panel" still hidden (needs system_admin)
}

// --- React component example ---

interface SidebarProps {
  memberRoles: string[];
}

export function Sidebar({ memberRoles }: SidebarProps) {
  const visibleItems = filterNavItems(allNavItems, memberRoles);

  return (
    <nav>
      <ul>
        {visibleItems.map((item) => (
          <li key={item.id}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Run example
exampleHidePattern();

