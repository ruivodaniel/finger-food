/**
 * OrgLayout — the /organizations/:organizationId/* section: the organization's
 * name in the title band, its sections (Info · Members) in the section's own
 * left panel, the subpage in the main column. The param may be the literal
 * `current`, which the module resolves to the session's active org. The name
 * and the panel come from the module; the structure is PageLayout's.
 */
import { OrgSectionNav, useOrganizationName } from "@modules/user-organization-mgmt/web";
import { Outlet, useLocation, useParams } from "@tanstack/react-router";
import { createElement, type ComponentType } from "react";
import { PageLayout } from "@/components/PageLayout";
import { TitleHeader } from "@/components/TitleHeader";

// boundary: TanStack
const RouterOutlet = Outlet as ComponentType;

export function OrgLayout() {
  const { organizationId = "current" } = useParams({ strict: false }) as {
    organizationId?: string;
  };
  const pathname = useLocation({ select: (l) => l.pathname });
  const section = pathname.endsWith("/members") ? "members" : "info";
  const name = useOrganizationName(organizationId);
  return (
    <PageLayout
      header={<TitleHeader icon="building" title={name ?? "Organization"} titleTestId="org-frame-title" />}
      sidebar={<OrgSectionNav organizationId={organizationId} section={section} />}
    >
      {createElement(RouterOutlet)}
    </PageLayout>
  );
}
