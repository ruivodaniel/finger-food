/**
 * MeteorList — one list for both list pages: the rows as a table, the page
 * decides the title and whether a row opens the company's or the public detail.
 */

import * as React from "react";
import { Badge, Button, Icon, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { MeteorStatus } from "../../../shared/types";

export interface MeteorListRow {
  id: string;
  name: string;
  diameterKm: string | null;
  discoveredAt: string | null;
  status?: MeteorStatus;
}

export interface MeteorListProps {
  rows: MeteorListRow[];
  onOpen: (meteorId: string) => void;
  emptyText: string;
  /** Who locked a meteor, for the ones that are locked: a lock beside its name. */
  lockedBy?: (meteorId: string) => string | undefined;
  /** What else shows beside a meteor's name: who is editing it, on the organization's list. */
  besideName?: (meteorId: string) => React.ReactNode;
}

export function MeteorList({ rows, onOpen, emptyText, lockedBy, besideName }: MeteorListProps): React.ReactElement {
  if (rows.length === 0) {
    return <span element="type--body-small" emphasis="quiet" data-testid="meteors-empty">{emptyText}</span>;
  }
  const withStatus = rows.some((r) => r.status);
  return (
    <Table data-testid="meteors-table">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Diameter (km)</TableHead>
          <TableHead>Discovered</TableHead>
          {withStatus && <TableHead>Status</TableHead>}
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((m) => (
          <TableRow key={m.id} data-testid={`meteor-row-${m.id}`}>
            <TableCell>
              <Stack dir="row" scale="xs" align="center">
                <span>{m.name}</span>
                {lockedBy?.(m.id) && (
                  <span title={`Locked by ${lockedBy(m.id)}`} aria-label={`Locked by ${lockedBy(m.id)}`} data-testid={`meteor-row-${m.id}-locked`}><Icon name="lock" scale="sm" /></span>
                )}
                {besideName?.(m.id)}
              </Stack>
            </TableCell>
            <TableCell>{m.diameterKm ?? "—"}</TableCell>
            <TableCell>{m.discoveredAt ?? "—"}</TableCell>
            {withStatus && (
              <TableCell>
                <Badge emphasis="quiet" status={m.status === "published" ? "success" : "neutral"}>{m.status}</Badge>
              </TableCell>
            )}
            <TableCell>
              <Stack dir="row" justify="end" className="w-full">
                <Button buttonType="icon" startIcon="arrowRight" emphasis="secondary" scale="sm" aria-label={`Open ${m.name}`} data-testid={`meteor-row-${m.id}-open`} onClick={() => onOpen(m.id)} />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
