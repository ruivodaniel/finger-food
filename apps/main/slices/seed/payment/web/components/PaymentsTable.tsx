/**
 * PaymentsTable — every movement of real money on the owner, newest first:
 * what was paid, what came back, and the credits a payment brought. Credits
 * themselves have their own ledger; this list is money only.
 */

import * as React from "react";
import { Badge, Card, CardContent, CardFooter, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import type { PaymentRecord } from "../../shared/types";
import { PAYMENT_KIND_LABELS, formatDate, plainCredits, signedMoney } from "../lib/format";

export interface PaymentsTableProps {
  rows: PaymentRecord[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaymentsTable({ rows, total, page, pageSize, onPageChange }: PaymentsTableProps): React.ReactElement {
  return (
    <Card data-testid="payments-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">Payments</h3>
          <span element="type--body-small" emphasis="quiet">
            Every movement of real money, newest first.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No payments yet." data-testid="payments-empty" />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>What</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} data-testid={`payment-${r.id}`}>
                  <TableCell>{formatDate(r.createdAt)}</TableCell>
                  <TableCell>
                    <Badge status={r.amount < 0 ? "warning" : "neutral"}>{PAYMENT_KIND_LABELS[r.kind]}</Badge>
                  </TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell className="text-right">{r.creditsGranted > 0 ? plainCredits(r.creditsGranted) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <span status={r.amount < 0 ? "error" : undefined}>{signedMoney(r.amount, r.currency)}</span>
                  </TableCell>
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
