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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon, SidebarMenuButton } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useComponents } from "../../hooks/use-components";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { useSwitchActiveOrg } from "../../hooks/use-switch-active-org";
import { getActiveOrgId, setActiveOrgId } from "../../lib/active-org";

import { queryKeys } from "../../lib/query-keys";

export function OrgSwitcher(): React.ReactElement | null {
  const { OrganizationAvatar } = useComponents();
  const { client } = useUserOrgMgmtContext();
  const queryClient = useQueryClient();
  const { data: sessionData } = useSession();
  const switchActiveOrg = useSwitchActiveOrg();

  const { data: memberships } = useQuery({
    queryKey: queryKeys.memberships,
    queryFn: () => client.listMemberships(),
    enabled: !!sessionData?.session,
  });

  const activeId = sessionData?.session?.activeOrganizationId ?? "";

  const change = (organizationId: string) => void switchActiveOrg(organizationId);

  React.useEffect(() => {
    if (!memberships || memberships.length === 0) return;
    const stored = getActiveOrgId();
    if (!stored || !memberships.some((m) => m.organization.id === stored)) {
      setActiveOrgId(memberships[0].organization.id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
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
          <OrganizationAvatar name={activeOrg.name} image={activeOrg.logo} scale="sm" />
          <span
            element="type--body"
            position="fill clip"
            data-testid="org-switcher-current"
          >
            {activeOrg.name}
          </span>
          <Icon name="chevronDown" size="sm" />
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
              <Stack dir="row" align="center" gap={8} className="w-full">
                <OrganizationAvatar name={org.name} image={org.logo} scale="xs" />
                <span element="type--body" position="fill clip">{org.name}</span>
                {active && <Icon name="check" size="sm" />}
              </Stack>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
