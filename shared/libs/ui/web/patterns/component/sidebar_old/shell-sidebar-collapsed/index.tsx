import {
  Avatar,
  AvatarFallback,
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  Tile,
  type IconName,
  useSidebar,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { Instance } from "../../../../lib/instance";

type NavItem = { id: string; title: string; icon: IconName; selected?: boolean; count?: number };

const NAV: NavItem[] = [
  { id: "home", title: "Home", icon: "home" },
  { id: "organizations", title: "Organizations", icon: "users", selected: true, count: 2 },
  { id: "legal-documents", title: "Legal documents", icon: "fileText" },
];

// the collapse toggle as a menu item — its label follows the state
function ToggleItem() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <SidebarMenuItem>
      <SidebarMenuButton emphasis="primary" concept="sidebar-toggle" tooltip={collapsed ? "Expand" : "Collapse"} onClick={toggleSidebar}>
        <Icon name={collapsed ? "panelLeft" : "panelRight"} scale="sm" />
        <span className="flex-1 truncate">{collapsed ? "Expand" : "Collapse"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// the platform's logo slot — the full mark when expanded, a monogram in the rail
function LogoSlot() {
  const { state } = useSidebar();
  return state === "collapsed"
    ? <Avatar scale="sm"><AvatarFallback>PL</AvatarFallback></Avatar>
    : <Tile emphasis="quiet" className="p-1"><span element="type--body-extra-small" emphasis="quiet">Platform logo</span></Tile>;
}

function ShellSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <SidebarProvider open={open} onOpenChange={onOpenChange} className="h-full">
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Stack dir="col" scale="3xs">
            <LogoSlot />
            <SidebarMenuButton emphasis="primary" concept="org-switcher" tooltip="System Admin">
              <Avatar scale="sm"><AvatarFallback>SA</AvatarFallback></Avatar>
              <span element="type--body" className="flex-1 truncate">System Admin</span>
              <Icon name="chevronDown" scale="sm" />
            </SidebarMenuButton>
          </Stack>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <ToggleItem />
              {NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton emphasis="primary" concept="main-nav-item" tooltip={item.title} isActive={item.selected}>
                    <Icon name={item.icon} scale="sm" />
                    <span className="flex-1 truncate">{item.title}</span>
                  </SidebarMenuButton>
                  {item.count && <SidebarMenuBadge>{item.count}</SidebarMenuBadge>}
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

/** the measure of the previewer's container around each fixture */
export const measure = "xs";

export default function ShellSidebarFixture() {
  return (
    <div className="h-96 flex">
      <Instance id="shell-sidebar" initial={{ data: { open: false } }}>
        {(x) => <ShellSidebar open={x.data.open as boolean} onOpenChange={(x.bind("open") as { onChange: (v: boolean) => void }).onChange} />}
      </Instance>
    </div>
  );
}
