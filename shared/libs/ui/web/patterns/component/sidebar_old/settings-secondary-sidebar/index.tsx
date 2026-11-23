import {
  Icon,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  type IconName,
} from "@libs/web-components";
import { LeftSidebar } from "@libs/web-layouts";

type NavItem = { id: string; title: string; icon: IconName; selected?: boolean };

const SETTINGS: NavItem[] = [
  { id: "account", title: "Account", icon: "mail", selected: true },
  { id: "profile", title: "Profile", icon: "user" },
  { id: "security", title: "Security", icon: "lock" },
  { id: "legal", title: "Legal agreements", icon: "bookOpen" },
  { id: "preferences", title: "Preferences", icon: "settings" },
];

/** the measure of the previewer's container around each fixture */
export const measure = "xs";

export default function SettingsSecondarySidebarFixture() {
  return (
    <SidebarProvider open onOpenChange={() => {}} className="h-96">
      <LeftSidebar className="h-96 flex flex-col">
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {SETTINGS.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton isActive={item.selected} tooltip={item.title}>
                  <Icon name={item.icon} scale="sm" />
                  <span className="flex-1 truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </LeftSidebar>
    </SidebarProvider>
  );
}
