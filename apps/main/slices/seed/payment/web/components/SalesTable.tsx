/**
 * SalesTable — the vendor's sales, newest first: who bought, what, how it
 * was paid, the platform's fee and what was given back. A money refund is
 * made in the Stripe dashboard and shows here once Stripe reports it; a sale
 * the vendor may still settle in its credits carries the way to do so.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { ListPagination } from "@libs/list-query/client";
import type { PurchaseView } from "../../shared/types";
import { formatDate, money, settledLabel } from "../lib/format";

export interface SalesTableProps {
  rows: PurchaseView[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** whether a sale can still be settled in the vendor's credits; absent, no action shows */
  canSettleInCredits?: (sale: PurchaseView) => boolean;
  onSettle?: (sale: PurchaseView) => void;
}

export function SalesTable({ rows, total, page, pageSize, onPageChange, canSettleInCredits, onSettle }: SalesTableProps): React.ReactElement {
  return (
    <Card data-testid="sales-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">Sales</h3>
          <span element="type--body-small" emphasis="quiet">
            A money refund is made in the Stripe dashboard and shows here once Stripe reports it; a credit refund is made here, within the product's refund policy.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="No sales yet." data-testid="sales-empty" />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid with</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead>Refunded</TableHead>
                <TableHead>When</TableHead>
                {onSettle && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const settled = settledLabel(s);
                return (
                  <TableRow key={s.id} data-testid={`sale-${s.id}`}>
                    <TableCell>{s.buyerName}</TableCell>
                    <TableCell>{s.productName}</TableCell>
                    <TableCell className="text-right">{s.quantity}</TableCell>
                    <TableCell className="text-right">{money(s.amountTotal, s.currency)}</TableCell>
                    <TableCell>{s.paidWith === "card" ? "card" : "your credits"}</TableCell>
                    <TableCell className="text-right">
                      <span emphasis="quiet">{money(s.applicationFeeAmount, s.currency)}</span>
                    </TableCell>
                    <TableCell>{settled ? <Badge status="warning">{settled}</Badge> : "—"}</TableCell>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                    {onSettle && (
                      <TableCell className="text-right">
                        {canSettleInCredits?.(s) && (
                          <Button emphasis="quiet" scale="sm" onClick={() => onSettle(s)} data-testid={`credit-refund-${s.id}`}>
                            Refund as credits
                          </Button>
                        )}
                      </TableCell>
                    )}
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
