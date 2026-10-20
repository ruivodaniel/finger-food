/**
 * Account sidebar — the signed-in shell's navigation: the brand row (product
 * mark + notification bell) and the org switcher, the collapse toggle as the
 * first item, the nav entries (gated by the active membership's effective
 * roles — navigation.config requiredRoles · useMemberRoles), and the user's
 * identity in the footer, whose menu holds settings, memberships,
 * invitations, dark mode and sign out.
 *
 * Collapses to an icon rail (`collapsible="icon"`; the state persists in the
 * sidebar's cookie) — items keep their icons, titles become tooltips. Markup
 * is the Sidebar parts only: the theme decides how a row looks.
 */

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Switch,
  useSidebar,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { NotificationBell } from "@modules/notifications/web";
import {
  OrgSwitcher,
  useLogout,
  usePendingInvitationCount,
  useSession,
} from "@modules/user-organization-mgmt/web";
import { Link, useLinkProps, useMatchRoute } from "@tanstack/react-router";
import { NAV_ENTRIES, visibleTo, type AppNavEntry } from "@/config/navigation.config";
import { isDarkMode, setColorMode } from "@/lib/color-mode";
import { initialsOf } from "@/lib/initials";
import { UserAvatar } from "@/components/UserAvatar";
import { useMemberRoles } from "@/lib/use-member-roles";

const PRODUCT_NAME = "Seed";

/** The product mark beside the bell; stacked into the rail when collapsed. */
function BrandRow() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Stack
      dir={collapsed ? "col" : "row"}
      align="center"
      justify={collapsed ? "start" : "between"}
      gap={4}
      className="w-full px-2"
    >
      {collapsed ? (
        <Avatar scale="sm">
          <AvatarFallback>{initialsOf(PRODUCT_NAME)}</AvatarFallback>
        </Avatar>
      ) : (
        <span element="type--body-small" emphasis="quiet">
          {PRODUCT_NAME}
        </span>
      )}
      {/* Renders nothing until the inbox read settles. */}
      <NotificationBell />
    </Stack>
  );
}

/** The collapse toggle as the first item; its label and icon follow the state. */
function SidebarToggleItem() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            emphasis="primary"
            concept="sidebar-toggle"
            tooltip={collapsed ? "Expand" : "Collapse"}
            onClick={toggleSidebar}
            data-testid="sidebar-toggle"
          >
            <Icon name={collapsed ? "panelLeft" : "panelRight"} size="sm" />
            <span className="flex-1 truncate">{collapsed ? "Expand" : "Collapse"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

/**
 * One main-nav entry. A plain anchor from useLinkProps rather than <Link>:
 * <Link> reads `state` as history state, and the theme marks the current
 * entry by the `state="selected"` attribute.
 */
function MainNavItem({ entry }: { entry: AppNavEntry }) {
  const matchRoute = useMatchRoute();
  const selected = !!matchRoute({ to: entry.to as never });
  const linkProps = useLinkProps({ to: entry.to as never });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={entry.title}
        emphasis="primary"
        concept="main-nav-item"
      >
        <a
          {...linkProps}
          data-testid={`nav-${entry.id}`}
          aria-current={selected ? "page" : undefined}
          state={selected ? "selected" : undefined}
        >
          <Icon name={entry.icon} size="sm" />
          <span className="flex-1 truncate">{entry.title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AccountSidebar() {
  const logout = useLogout({ loginPath: "/login" });
  const { data: session } = useSession();
  const pendingInvitations = usePendingInvitationCount();
  const roles = useMemberRoles();
  const [dark, setDark] = useState(isDarkMode);

  // Name is optional; fall back to the primary identifier so the footer always
  // shows who's signed in.
  const user = session?.user ?? null;
  const displayName =
    user?.profile.name ?? user?.identifiers[0]?.value ?? "Account";

  const toggleDark = () => {
    setColorMode(!dark);
    setDark(!dark);
  };

  return (
    <SidebarProvider className="h-full" defaultOpen>
      <Sidebar collapsible="icon" data-testid="account-sidebar">
        <SidebarHeader>
          <Stack dir="col" gap={2}>
            <BrandRow />
            {/* Active-organization switcher; renders nothing until the caller
                belongs to an org. */}
            <OrgSwitcher />
          </Stack>
        </SidebarHeader>
        <SidebarContent>
          <SidebarToggleItem />
          <SidebarGroup>
            <SidebarMenu>
              {NAV_ENTRIES.filter(visibleTo(roles)).map((entry) => (
                <MainNavItem key={entry.to} entry={entry} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip={displayName}
                    emphasis="primary"
                    data-testid="sidebar-user-menu"
                  >
                    <UserAvatar name={displayName} image={user?.profile.image} scale="sm" />
                    <span className="flex-1 truncate">{displayName}</span>
                    <Icon name="moreVertical" size="sm" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  <DropdownMenuItem asChild data-testid="user-menu-settings">
                    <Link to={"/my/settings/account" as never}>
                      <Icon name="settings" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild data-testid="user-menu-my-memberships">
                    <Link to={"/my/memberships" as never}>
                      <Icon name="briefcase" />
                      My memberships
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild data-testid="user-menu-my-invitations">
                    <Link to={"/my/invitations" as never}>
                      <Icon name="inbox" />
                      My invitations
                      {pendingInvitations > 0 && (
                        <Badge status="info" className="ml-auto">
                          {pendingInvitations}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="user-menu-dark-mode"
                    onSelect={(e) => {
                      e.preventDefault(); // keep the menu open so the flip is visible
                      toggleDark();
                    }}
                  >
                    <Icon name={dark ? "moon" : "sun"} />
                    <span className="flex-1">Dark mode</span>
                    <Switch checked={dark} className="pointer-events-none" />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="sidebar-logout"
                    onSelect={() => void logout()}
                  >
                    <Icon name="logout" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
