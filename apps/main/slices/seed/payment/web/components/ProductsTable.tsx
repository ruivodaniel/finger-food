/**
 * ProductsTable — the vendor's products: the price, how a purchase of it may
 * be settled, whether it is listed, and the way to edit, archive or restore
 * it. Archiving takes it off the Marketplace; past purchases keep their name
 * and price.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { ProductView } from "../../shared/types";
import { REFUND_POLICY_LABELS, money } from "../lib/format";

export interface ProductsTableProps {
  rows: ProductView[];
  canCreate: boolean;
  onNew: () => void;
  onEdit: (product: ProductView) => void;
  onToggleActive: (product: ProductView) => void;
  busy?: boolean;
}

export function ProductsTable({ rows, canCreate, onNew, onEdit, onToggleActive, busy }: ProductsTableProps): React.ReactElement {
  return (
    <Card data-testid="products-card">
      <CardHeader>
        <Stack dir="row" align="center" scale="sm" justify="between">
          <h3 element="type--heading4">Products</h3>
          <Button emphasis="primary" scale="sm" startIcon="add" buttonType="icon-text" disabled={!canCreate || busy} onClick={onNew} data-testid="new-product">
            New product
          </Button>
        </Stack>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            title={canCreate ? "No products yet." : "Products can be created once Stripe confirms the account can take payments."}
            data-testid="products-empty"
          />
        ) : (
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead>Refunds</TableHead>
                <TableHead>Listed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id} data-testid={`product-${p.id}`}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>
                    <span element="type--body-small" emphasis="quiet">
                      {p.description ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{money(p.unitAmount, p.currency)}</TableCell>
                  <TableCell>{REFUND_POLICY_LABELS[p.refundPolicy]}</TableCell>
                  <TableCell>{p.active ? <Badge status="success">in the Marketplace</Badge> : <Badge status="neutral">archived</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Stack dir="row" scale="2xs" justify="end">
                      <Button emphasis="quiet" scale="sm" startIcon="edit" buttonType="icon-text" disabled={busy} onClick={() => onEdit(p)} data-testid={`edit-${p.id}`}>
                        Edit
                      </Button>
                      <Button
                        emphasis="quiet"
                        scale="sm"
                        startIcon={p.active ? "archive" : "refresh"}
                        buttonType="icon-text"
                        disabled={busy}
                        onClick={() => onToggleActive(p)}
                        data-testid={`${p.active ? "archive" : "restore"}-${p.id}`}
                      >
                        {p.active ? "Archive" : "Restore"}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
