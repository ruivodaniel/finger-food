/**
 * LotsTable — every lot the owner was granted, newest first: what issued it,
 * where it may be spent, what was granted and what remains, and when it
 * expires. An expired lot stays listed, greyed, with nothing remaining.
 */

import * as React from "react";
import { Badge, Card, CardContent, CardFooter, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import type { LotView } from "../../../shared/types";
import { LOT_LABELS, credits, formatDate, lotKind, servicesLabel } from "../helpers/format";

export interface LotsTableProps {
  rows: LotView[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  vendorName?: (organizationId: string) => string;
  /** names a catalog service */
  serviceName: (key: string) => string;
}

export function LotsTable({ rows, total, page, pageSize, onPageChange, vendorName = (id) => id, serviceName }: LotsTableProps): React.ReactElement {
  return (
    <Card data-testid="lots-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">Lots</h3>
          <span element="type--body-small" emphasis="quiet">
            Gifts are spent first, then the plan's credits, then bundles; among equals, credits for some services only go first, then the one expiring soonest. Vendor credits are spent only at their vendor.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No credits yet." data-testid="lots-empty" />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Lot</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Can pay for</TableHead>
                <TableHead className="text-right">Granted</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lot) => {
                const kind = lotKind(lot.reason);
                const quiet = lot.expired ? "quiet" : undefined;
                return (
                  <TableRow key={lot.id} data-testid={`lot-${lot.id}`}>
                    <TableCell>
                      <span emphasis={quiet}>
                        {LOT_LABELS[lot.reason]} · {formatDate(lot.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>{lot.expired ? <Badge status="neutral">expired</Badge> : <Badge status={kind.tone}>{kind.label}</Badge>}</TableCell>
                    <TableCell>
                      <span emphasis={quiet}>{lot.vendorOrganizationId ? vendorName(lot.vendorOrganizationId) : servicesLabel(lot.services, serviceName)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span emphasis={quiet}>{credits(lot.amount)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span emphasis={quiet}>{credits(lot.expired ? 0 : lot.remaining)}</span>
                    </TableCell>
                    <TableCell>
                      <span emphasis={quiet}>{lot.expiresAt ? formatDate(lot.expiresAt) : "never"}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
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
