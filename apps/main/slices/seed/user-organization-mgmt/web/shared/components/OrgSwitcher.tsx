/**
 * OrgSwitcher — the signed-in caller's active organization. A dropdown over
 * their memberships; selecting one writes the client-side store (the api
 * client sends it as the context header) and refreshes the session.
 * When the store is empty or stale it self-heals to the first membership.
 * The hosting app embeds this in its shell's sidebar header. Renders nothing
 * until the caller belongs to at least one org.
 *
 * The trigger is a sidebar item (control--sidebar-item) showing the active
 * org's avatar — its logo, else a monogram — its name, and a chevron; each
 * menu row the same avatar and name, the active one selected and checked.
 */

import * as React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon, SidebarMenuButton, Avatar, AvatarFallback, AvatarImage, Text } from "@libs/web-components";
import { initialsOf } from "../helpers/initials";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticationService } from "../../services/application/authentication.service";
import { membershipsService } from "../../services/application/memberships.service";
import { setActiveOrg, getActiveOrgId } from "../../store/active-organization.store";


export function OrgSwitcher(): React.ReactElement | null {
  const queryClient = useQueryClient();
  const { data: sessionData } = useQuery(authenticationService.getSession());
  const switchActiveOrg = membershipsService.switchActiveOrg;

  const { data: memberships } = useQuery({
    ...membershipsService.listMyMemberships(),
    enabled: !!sessionData?.session,
  });

  const activeId = sessionData?.session?.activeOrganizationId ?? "";

  const change = (organizationId: string) => void switchActiveOrg(organizationId);

  React.useEffect(() => {
    if (!memberships || memberships.length === 0) return;
    const stored = getActiveOrgId();
    if (!stored || !memberships.some((m) => m.organization.id === stored)) {
      setActiveOrg(memberships[0].organization.id);
      void queryClient.invalidateQueries({ queryKey: authenticationService.keys.session });
    }
  }, [memberships, queryClient]);

  if (!sessionData?.session || !memberships || memberships.length === 0) {
    return null;
  }

  // Covers the window before the self-heal's session refetch settles.
  const activeOrg =
    memberships.find((m) => m.organization.id === activeId)?.organization ??
    memberships[0].organization;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          emphasis="primary"
          tooltip={activeOrg.name}
          concept="org-switcher"
          data-testid="org-switcher"
        >
          <Avatar scale="sm">
            {activeOrg.logo && <AvatarImage src={activeOrg.logo} alt="" />}
            <AvatarFallback>{initialsOf(activeOrg.name)}</AvatarFallback>
          </Avatar>
          <Stack size="fill">
            <Text type="body" position="clip" data-testid="org-switcher-current">
              {activeOrg.name}
            </Text>
          </Stack>
          <Icon name="chevronDown" scale="sm" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {memberships.map((membership) => {
          const org = membership.organization;
          const active = org.id === activeOrg.id;
          return (
            <DropdownMenuItem
              key={org.id}
              data-testid={`org-switcher-item-${org.id}`}
              state={active ? "selected" : undefined}
              onSelect={() => change(org.id)}
            >
              <Stack dir="row" align="center" scale="sm" size="fill">
                <Avatar scale="xs">
                  {org.logo && <AvatarImage src={org.logo} alt="" />}
                  <AvatarFallback>{initialsOf(org.name)}</AvatarFallback>
                </Avatar>
                <Stack size="fill"><Text type="body" position="clip">{org.name}</Text></Stack>
                {active && <Icon name="check" scale="sm" />}
              </Stack>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
