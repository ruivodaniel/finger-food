/**
 * LegalAdminSidebar — the authoring catalog as navigation: the Platform
 * group first, then one group per org type, each listing its document
 * types as the theme's sidebar items (the selected one `state="selected"`).
 * Selection is the URL (the page's props); this renders and reports clicks.
 */

import * as React from "react";
import { Icon, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { LegalAdminSelection } from "../helpers/legal-admin-selection";

export interface LegalAdminSidebarProps {
  catalog: Array<{ orgTypeId: string | null; label: string; types: string[] }>;
  selection: LegalAdminSelection | null;
  onSelect: (selection: LegalAdminSelection) => void;
}

/** "termsAndConditions" → "Terms and conditions". */
export function documentTypeLabel(type: string): string {
  const words = type.replace(/([A-Z])/g, " $1").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function LegalAdminSidebar({
  catalog,
  selection,
  onSelect,
}: LegalAdminSidebarProps): React.ReactElement {
  return (
    <nav
      data-testid="legal-admin-sidebar"
      element="control-group--sidebar"
    >
      <Stack dir="col" scale="lg">
      {catalog.map((group) => (
        <Stack key={group.orgTypeId ?? "platform"} dir="col" scale="2xs">
          <Text type="body-extra-small" emphasis="quiet">
            {group.label}
          </Text>
          {group.types.map((type) => {
            const active =
              selection?.type === type && selection?.orgTypeId === group.orgTypeId;
            return (
              <a
                key={type}
                href="#"
                data-testid={`legal-admin-item-${group.orgTypeId ?? "platform"}-${type}`}
                aria-current={active ? "page" : undefined}
                element="control--sidebar-item"
                state={active ? "selected" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect({ type, orgTypeId: group.orgTypeId });
                }}
              >
                <Icon name="fileText" scale="sm" />
                {documentTypeLabel(type)}
              </a>
            );
          })}
        </Stack>
      ))}
      </Stack>
    </nav>
  );
}
