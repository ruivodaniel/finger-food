import {
  Avatar,
  AvatarFallback,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
  type IconName,
  useSidebar,
} from "@libs/web-components";
import { Page, ShellNav, ShellSideNav, Stack } from "@libs/web-layouts";
import { Instance } from "../../../lib/instance";

// Markup after the app's AccountSidebar: the Sidebar parts only, the theme decides how a row looks.

type NavItem = { id: string; title: string; icon: IconName };

const NAV: NavItem[] = [
  { id: "home", title: "Home", icon: "home" },
  { id: "organizations", title: "Organizations", icon: "users" },
  { id: "legal-documents", title: "Legal documents", icon: "fileText" },
];

/** the product mark; stacked into the rail as an avatar when collapsed */
function BrandRow() {
  const { state } = useSidebar();
  return (
    <Stack dir="col" align="center" justify="start" scale="2xs" className="w-full px-2">
      {state === "collapsed"
        ? <Avatar scale="sm"><AvatarFallback>PL</AvatarFallback></Avatar>
        : <span element="type--body-small" emphasis="quiet">Platform</span>}
      <Popover>
        <PopoverTrigger asChild><Button emphasis="quiet" scale="sm" buttonType="icon" startIcon="bell" aria-label="Notifications" data-testid="bell" /></PopoverTrigger>
        <PopoverContent side="right" align="start"><span element="type--body">No notifications</span></PopoverContent>
      </Popover>
    </Stack>
  );
}

/** the toggle expands and collapses inline; its label and icon follow the state */
function SidebarToggleItem() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton emphasis="primary" concept="sidebar-toggle" tooltip={collapsed ? "Expand" : "Collapse"} onClick={toggleSidebar}>
            <Icon name={collapsed ? "panelLeft" : "panelRight"} scale="sm" />
            <span className="flex-1 truncate">{collapsed ? "Expand" : "Collapse"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

function AccountSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <SidebarProvider open={open} onOpenChange={onOpenChange} className="h-full">
      <Sidebar collapsible="icon" peek>
        <SidebarHeader>
          <Stack dir="col" scale="3xs">
            <BrandRow />
            <SidebarMenuButton emphasis="primary" concept="org-switcher" tooltip="System Admin">
              <Avatar scale="sm"><AvatarFallback>SA</AvatarFallback></Avatar>
              <span element="type--body" className="flex-1 truncate">System Admin</span>
              <Icon name="chevronDown" scale="sm" />
            </SidebarMenuButton>
          </Stack>
        </SidebarHeader>
        <SidebarContent>
          <SidebarToggleItem />
          <SidebarGroup>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton emphasis="primary" concept="main-nav-item" tooltip={item.title} isActive={item.id === "organizations"}>
                    <Icon name={item.icon} scale="sm" />
                    <span className="flex-1 truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton emphasis="primary" tooltip="Samantha Reyes">
                <Avatar scale="sm"><AvatarFallback>SR</AvatarFallback></Avatar>
                <span className="flex-1 truncate">Samantha Reyes</span>
                <Icon name="moreVertical" scale="sm" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

/** the pattern as a fixture: the sidebar in the shell's nav zone, collapsed. Hover it for 900 ms to open it in a popover over the page zone; the toggle expands it inline and the page zone adapts. */
export default function Fixture() {
  return (
    <div className="flex h-screen w-full items-stretch bg-black/5 py-8 pl-8 pr-16">
      <div className="relative flex-1 overflow-hidden border border-black/30 shadow-lg" style={{ background: "var(--background)" }}>
        <ShellSideNav className="flex w-full overflow-hidden" style={{ height: "100%" }}>
          <ShellNav className="flex h-full flex-col">
            <Instance id="layout-shell-sidebar" initial={{ data: { open: false } }}>
              {(x) => <AccountSidebar open={x.data.open as boolean} onOpenChange={(x.bind("open") as { onChange: (v: boolean) => void }).onChange} />}
            </Instance>
          </ShellNav>
          <Page className="flex flex-1 flex-col overflow-hidden">
            <span element="type--heading2">Page zone</span>
          </Page>
        </ShellSideNav>
      </div>
    </div>
  );
}
