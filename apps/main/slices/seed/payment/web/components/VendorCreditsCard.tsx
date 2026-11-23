/**
 * VendorCreditsCard — the credits the vendor has issued (credit refunds and
 * promotions) and still owes: what remains unspent and unexpired, per holder,
 * with the soonest expiry. Holders spend them on the vendor's products only,
 * and no money moves when they do. The way to give a promotion starts here.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VendorCreditsView } from "../../shared/types";
import { formatDate, money } from "../lib/format";

export interface VendorCreditsCardProps {
  credits: VendorCreditsView;
  onPromote: () => void;
  busy?: boolean;
}

export function VendorCreditsCard({ credits, onPromote, busy }: VendorCreditsCardProps): React.ReactElement {
  const c = credits.currency;
  return (
    <Card className="flex-1 min-w-72" data-testid="vendor-credits-card">
      <CardHeader>
        <Stack dir="row" align="center" scale="sm">
          <h3 element="type--heading4">Credits you issued</h3>
          <Badge status={credits.outstanding > 0 ? "warning" : "neutral"} data-testid="vendor-credits-outstanding">
            {money(credits.outstanding, c)} outstanding
          </Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack dir="col" scale="sm">
          <span element="type--body-small" emphasis="quiet">
            {money(credits.issued, c)} issued in all. Holders spend them on your products only; no money moves when they do.
          </span>
          {credits.holders.length > 0 && (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Holder</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits.holders.map((h) => (
                  <TableRow key={h.owner.organizationId ?? h.owner.userId} data-testid="vendor-credits-holder">
                    <TableCell>{h.ownerName}</TableCell>
                    <TableCell className="text-right">{money(h.remaining, c)}</TableCell>
                    <TableCell>{h.soonestExpiry ? formatDate(h.soonestExpiry) : "never"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Stack dir="row" scale="sm">
            <Button emphasis="secondary" scale="sm" startIcon="star" buttonType="icon-text" disabled={busy} onClick={onPromote} data-testid="give-promotion">
              Give a promotion
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
