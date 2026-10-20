/**
 * OrganizationsTable — the directory rows: the org (avatar · name over type),
 * its status badge, and an enter action ONLY for orgs the caller belongs to.
 * Entering OPENS the org's pages — it never activates it. Foreign rows stay
 * inert: whether the active org's grants reach a foreign org (a system
 * admin's do, for its details) isn't surfaced here yet.
 *
 * Table parts with stacked cells; an EmptyState when nothing matches. No
 * inline styles.
 */

import * as React from "react";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { OrganizationDirectoryView } from "../../../shared/types/domain";
import { useComponents } from "../../hooks/use-components";
import { EmptyState } from "../EmptyState";

export interface OrganizationsTableProps {
  rows: OrganizationDirectoryView[];
  /** Org ids the caller belongs to — the ones the enter action opens. */
  memberOrgIds: Set<string>;
  onEnter: (organizationId: string) => void;
}

export function OrganizationsTable({
  rows,
  memberOrgIds,
  onEnter,
}: OrganizationsTableProps): React.ReactElement {
  const { OrganizationAvatar } = useComponents();
  if (rows.length === 0) {
    return (
      <EmptyState
        kind="no-results"
        testId="organizations-empty"
        icon="building"
        title="No organizations match"
        description="Change the status, the search or the type to see more."
      />
    );
  }
  return (
    <Table data-testid="organizations-table">
      <TableHeader>
        <TableRow>
          <TableHead>Organization</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((org) => (
          <TableRow key={org.id} data-testid={`org-row-${org.id}`}>
            <TableCell>
              <OrganizationAvatar
                name={org.name}
                image={org.logo}
                scale="sm"
                showName
                detail={org.typeLabel}
              />
            </TableCell>
            <TableCell>
              <Badge emphasis="quiet" status={org.status === "active" ? "success" : "neutral"}>
                {org.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Stack dir="row" justify="end" className="w-full">
                {memberOrgIds.has(org.id) && (
                  <Button
                    data-testid={`org-row-${org.id}-enter`}
                    buttonType="icon"
                    startIcon="arrowRight"
                    emphasis="secondary"
                    scale="sm"
                    aria-label={`Open ${org.name}`}
                    onClick={() => onEnter(org.id)}
                  />
                )}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
