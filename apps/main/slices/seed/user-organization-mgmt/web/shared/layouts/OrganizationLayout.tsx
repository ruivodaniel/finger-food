/**
 * OrganizationLayout — the slice layout of one organization's area: the organization's name in the title band, its sections
 * (Info · Members) in the page left sidebar, the section page in the main container. The URL's `organizationId` may be the
 * literal `current`, resolved to the session's active org on the client; the backend only ever sees ids.
 */
import { Outlet, useLocation, useParams } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { DoubleSidebarLayout } from "@libs/web-layouts";
import { TitleHeader } from "@modules/shared/web";
import { OrgSectionNav } from "../components/OrgSectionNav";
import { useOrganization } from "../hooks/use-organization";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function OrganizationLayout() {
  const { organizationId = "current" } = useParams({ strict: false }) as { organizationId?: string };
  const pathname = useLocation({ select: (l) => l.pathname });
  const section = pathname.endsWith("/members") ? "members" : "info";
  const name = useOrganization(organizationId)?.name;
  return (
    <DoubleSidebarLayout
      scale="md"
      pageHeaderContent={<TitleHeader icon="building" title={name ?? "Organization"} titleTestId="org-frame-title" />}
      pageLeftSidebarContent={<OrgSectionNav organizationId={organizationId} section={section} />}
      mainContainerContent={createElement(RouterOutlet)}
    />
  );
}
