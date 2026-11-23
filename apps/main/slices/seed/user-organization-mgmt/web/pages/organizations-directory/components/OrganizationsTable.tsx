/**
 * OrganizationsTable — the directory rows: the org (avatar · name over type),
 * its status badge, and an enter action. Every row has one: the directory
 * lists only the orgs the active org's grants can read (a company member's
 * own org, a platform admin's companies, everything for a system admin), so
 * each one's pages open. Entering OPENS the org's pages — it never
 * activates it.
 *
 * Table parts with stacked cells; an EmptyState when nothing matches. No
 * inline styles.
 */

import * as React from "react";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, EmptyState, Icon, Avatar, AvatarFallback, AvatarImage, Text } from "@libs/web-components";
import { initialsOf } from "../../../shared/helpers/initials";
import { Stack } from "@libs/web-layouts";
import type { OrganizationDirectoryView } from "../../../../shared/types/domain";

export interface OrganizationsTableProps {
  rows: OrganizationDirectoryView[];
  onEnter: (organizationId: string) => void;
}

export function OrganizationsTable({
  rows,
  onEnter,
}: OrganizationsTableProps): React.ReactElement {
  if (rows.length === 0) {
    return (
      <EmptyState emphasis="quiet"
        data-testid="organizations-empty"
        icon={<Icon name="building" />}
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
              <Stack dir="row" align="center" scale="sm">
                <Avatar scale="sm">
                  {org.logo && <AvatarImage src={org.logo} alt="" />}
                  <AvatarFallback>{initialsOf(org.name)}</AvatarFallback>
                </Avatar>
                <Stack dir="col" scale="3xs" size="fill">
                  <Text type="body">{org.name}</Text>
                  <Text type="body-extra-small" emphasis="quiet">
                    {org.typeLabel}
                  </Text>
                </Stack>
              </Stack>
            </TableCell>
            <TableCell>
              <Badge emphasis="quiet" status={org.status === "active" ? "success" : "neutral"}>
                {org.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Stack dir="row" justify="end" size="fill">
                <Button
                  data-testid={`org-row-${org.id}-enter`}
                  buttonType="icon"
                  startIcon="arrowRight"
                  emphasis="secondary"
                  scale="sm"
                  aria-label={`Open ${org.name}`}
                  onClick={() => onEnter(org.id)}
                />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
