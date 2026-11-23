/**
 * SidebarShell — the signed-in shell (shell-side-nav): the sidebar and the page
 * slot. The page tree inside comes from the slice layouts the slices declare
 * (a section's own regions), never from here.
 */

import { ShellSideNav, ShellNav } from "@libs/web-layouts";
import { authenticationService } from "@modules/user-organization-mgmt/web";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { createElement, Fragment, type ComponentType, type ReactNode } from "react";
import { AccountSidebar } from "@/components/sidebar/AccountSidebar";

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
  const { data } = useQuery(authenticationService.getSession());
  return <Fragment key={data?.session?.activeOrganizationId ?? "none"}>{children}</Fragment>;
}
