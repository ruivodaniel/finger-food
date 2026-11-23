// The locks on a page: what is locked, by whom and since when, and Unlock where the server says the caller may.
import * as React from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { DocumentLockRow } from "../../../../shared/types";

export interface LocksTableProps {
  rows: DocumentLockRow[];
  unlocking: string | null;
  onUnlock: (row: DocumentLockRow) => void;
}

export function LocksTable({ rows, unlocking, onUnlock }: LocksTableProps): React.ReactElement {
  if (rows.length === 0) return <span element="type--body-small" emphasis="quiet" data-testid="locks-empty">Nothing is locked.</span>;
  return (
    <Table data-testid="locks-table">
      <TableHeader>
        <TableRow>
          <TableHead>What</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Locked by</TableHead>
          <TableHead>Since</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} data-testid={`lock-row-${row.documentId}`}>
            <TableCell>{row.title ?? row.documentId}</TableCell>
            <TableCell>{row.kind}</TableCell>
            <TableCell>{row.lockedByName}</TableCell>
            <TableCell>{new Date(row.lockedAt).toLocaleString()}</TableCell>
            <TableCell>
              <Stack dir="row" justify="end" className="w-full">
                {row.canUnlock && (
                  <Button buttonType="icon-text" startIcon="unlock" emphasis="secondary" scale="sm" data-testid={`lock-row-${row.documentId}-unlock`} disabled={unlocking === row.id} onClick={() => onUnlock(row)}>Unlock</Button>
                )}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
