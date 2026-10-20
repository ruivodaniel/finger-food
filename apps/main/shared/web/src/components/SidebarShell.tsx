/**
 * SidebarShell — the signed-in shell (shell-side-nav): the sidebar and the page
 * slot. Wraps the module's account routes; the module pages stay
 * layout-agnostic. The Page tree itself comes from the layouts underneath
 * (TitleBandLayout for regular pages, SettingsLayout for /my/settings/*,
 * OrgLayout for an organization), so each section owns its own regions.
 */

import { ShellSideNav, ShellNav } from "@libs/web-layouts";
import { useSession } from "@modules/user-organization-mgmt/web";
import { Outlet } from "@tanstack/react-router";
import { createElement, Fragment, type ComponentType, type ReactNode } from "react";
import { AccountSidebar } from "@/components/AccountSidebar";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function SidebarShell() {
  return (
    <ShellSideNav>
      <ShellNav>
        <AccountSidebar />
      </ShellNav>
      <OrgScope>{createElement(RouterOutlet)}</OrgScope>
    </ShellSideNav>
  );
}

/**
 * The page is bound to the active organization as a whole: the slot is keyed
 * on the session's activeOrganizationId (the server-validated one), so a
 * switch unmounts the entire page and mounts it fresh — every query asks
 * again under the new org header, every local state (filters, pages, open
 * sheets, drafts) starts over. Nothing in a page subscribes to the switch.
 */
function OrgScope({ children }: { children: ReactNode }) {
  const { data } = useSession();
  return <Fragment key={data?.session?.activeOrganizationId ?? "none"}>{children}</Fragment>;
}
