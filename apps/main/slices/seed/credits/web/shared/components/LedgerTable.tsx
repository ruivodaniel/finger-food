/**
 * LedgerTable — every movement, one row per lot touched, newest first, with
 * what the lot held after it. The service column names what a charge paid
 * for; the member column names who spent (organization accounts only).
 */

import * as React from "react";
import { Card, CardContent, CardFooter, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import type { LedgerEntry } from "../../../shared/types";
import { LEDGER_REASON_LABELS, LOT_LABELS, credits, formatDate, signedCredits } from "../helpers/format";

export interface LedgerTableProps {
  rows: LedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** names a catalog service */
  serviceName: (serviceKey: string) => string;
  /** names the acting member; absent on a personal account */
  memberName?: (userId: string) => string;
}

export function LedgerTable({ rows, total, page, pageSize, onPageChange, serviceName, memberName }: LedgerTableProps): React.ReactElement {
  return (
    <Card data-testid="ledger-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">Ledger</h3>
          <span element="type--body-small" emphasis="quiet">
            Every movement, one row per lot touched, newest first.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No movements yet." data-testid="ledger-empty" />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Delta</TableHead>
                <TableHead className="text-right">Lot after</TableHead>
                {memberName && <TableHead>Member</TableHead>}
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-testid={`ledger-${r.id}`}>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>{LOT_LABELS[r.lotReason]}</TableCell>
                  <TableCell>{LEDGER_REASON_LABELS[r.reason]}</TableCell>
                  <TableCell>{r.serviceKey ? serviceName(r.serviceKey) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <span status={r.delta < 0 ? "error" : "success"}>{signedCredits(r.delta)}</span>
                  </TableCell>
                  <TableCell className="text-right">{credits(r.lotRemainingAfter)}</TableCell>
                  {memberName && <TableCell>{r.userId ? memberName(r.userId) : "—"}</TableCell>}
                  <TableCell>{r.ref ? <span element="type--code">{r.ref}</span> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {total > pageSize && (
        <CardFooter>
          <ListPagination query={{ page, pageSize }} total={total} onPageChange={onPageChange} />
        </CardFooter>
      )}
    </Card>
  );
}
