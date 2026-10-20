/**
 * OrgSectionNav — the org area's own left panel: the sections of one
 * organization (Info · Members). The URL names the org (`current` aliases the
 * session's active org) and says which section is open. The hosting app puts
 * it in the left slot of the org layout; the pages render no section nav.
 * Same data-testids as the former OrgFrame (now OrgLayout) (org-section-nav, org-nav-<section>).
 */
import type * as React from "react";
import { Stack } from "@libs/web-layouts";
import { Icon, type IconName } from "@libs/web-components";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useSession } from "../../hooks/use-session";
import { useResolvedOrgId } from "../../hooks/use-resolved-org-id";
import { orgSectionPath, type OrgSection } from "../../lib/org-paths";

export interface OrgSectionNavProps {
  /** The URL's org: an id, or `current` for the session's active org. */
  organizationId: string;
  /** The section the URL opened. */
  section: OrgSection;
  /** Base of the org pages. */
  organizationsPath?: string;
}

const SECTIONS: Array<{ section: OrgSection; label: string; icon: IconName }> = [
  { section: "info", label: "Info", icon: "info" },
  { section: "members", label: "Members", icon: "users" },
];

export function OrgSectionNav({
  organizationId,
  section,
  organizationsPath = "/organizations",
}: OrgSectionNavProps): React.ReactElement {
  const { router } = useUserOrgMgmtContext();
  const { data: sessionData } = useSession();
  const { orgId } = useResolvedOrgId(organizationId);
  const activeOrgId = sessionData?.session?.activeOrganizationId ?? null;
  return (
    <nav data-testid="org-section-nav" element="control-group--sidebar">
      <Stack dir="col" gap={4} pad={16}>
        {SECTIONS.map((s) => {
          const selected = s.section === section;
          const to = orgId ? orgSectionPath(organizationsPath, orgId, activeOrgId, s.section) : "#";
          return (
            <a
              key={s.section}
              href={to}
              data-testid={`org-nav-${s.section}`}
              aria-current={selected ? "page" : undefined}
              element="control--sidebar-item"
              state={selected ? "selected" : undefined}
              onClick={(e) => {
                e.preventDefault();
                if (selected || !orgId) return;
                void router?.navigate({ to });
              }}
            >
              <Icon name={s.icon} size="sm" />
              {s.label}
            </a>
          );
        })}
      </Stack>
    </nav>
  );
}
