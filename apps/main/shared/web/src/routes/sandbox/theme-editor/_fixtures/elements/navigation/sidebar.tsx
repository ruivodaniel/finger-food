import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@libs/web-components";
import { FixtureBody } from "../_chrome";

export default function SidebarFixture() {
  return (
    <FixtureBody>
      <div style={{ height: 400, border: "1px solid #e4e4e7", borderRadius: 8, overflow: "hidden" }}>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <span element="type--body" style={{ padding: "8px 12px", display: "block" }}>My App</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem><SidebarMenuButton>Dashboard</SidebarMenuButton></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuButton isActive>Analytics</SidebarMenuButton></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuButton>Projects</SidebarMenuButton></SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>Settings</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem><SidebarMenuButton>Profile</SidebarMenuButton></SidebarMenuItem>
                    <SidebarMenuItem><SidebarMenuButton>Billing</SidebarMenuButton></SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <span element="type--body-small" emphasis="quiet" style={{ padding: "8px 12px", display: "block" }}>v1.0.0</span>
            </SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      </div>
    </FixtureBody>
  );
}
