/**
 * PurchasesTable — what the billing owner bought on the Marketplace, newest
 * first: the product as it was sold, the vendor, how it was paid, the
 * platform fee and what the vendor gave back. Refunds are the vendor's; they
 * show here once Stripe reports them.
 */

import * as React from "react";
import { Badge, Card, CardContent, CardFooter, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { ListPagination } from "@libs/list-query/client";
import type { PurchaseView } from "../../shared/types";
import { formatDate, money, settledLabel } from "../lib/format";

export interface PurchasesTableProps {
  rows: PurchaseView[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PurchasesTable({ rows, total, page, pageSize, onPageChange }: PurchasesTableProps): React.ReactElement {
  return (
    <Card data-testid="purchases-card">
      <CardHeader>
        <h3 element="type--heading4">Purchases</h3>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="Nothing bought yet. Products are in the Marketplace." data-testid="purchases-empty" />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Paid with</TableHead>
                <TableHead className="text-right">Platform fee</TableHead>
                <TableHead>Refunded</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => {
                const settled = settledLabel(p);
                return (
                  <TableRow key={p.id} data-testid={`purchase-${p.id}`}>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell>{p.sellerName}</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">{money(p.amountTotal, p.currency)}</TableCell>
                    <TableCell>{p.paidWith === "card" ? "card" : `${p.sellerName} credits`}</TableCell>
                    <TableCell className="text-right">
                      <span emphasis="quiet">{money(p.applicationFeeAmount, p.currency)}</span>
                    </TableCell>
                    <TableCell>{settled ? <Badge status="warning">{settled}</Badge> : "—"}</TableCell>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
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
