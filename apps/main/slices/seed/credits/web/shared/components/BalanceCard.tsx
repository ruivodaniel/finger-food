/**
 * BalanceCard — the balance in credits: what remains in the unexpired platform
 * lots for everything, what remains for some services only, and what is held
 * at each vendor for that vendor's products only. Never a column: the server
 * sums the lots.
 */

import * as React from "react";
import { Card, CardContent, CardHeader } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { CreditsSummary } from "../../../shared/types";
import { credits, servicesLabel } from "../helpers/format";

export interface BalanceCardProps {
  summary: CreditsSummary;
  /** names a catalog service */
  serviceName: (key: string) => string;
}

export function BalanceCard({ summary, serviceName }: BalanceCardProps): React.ReactElement {
  return (
    <Card className="flex-1 min-w-64" data-testid="balance-card">
      <CardHeader>
        <h3 element="type--heading4">Balance</h3>
      </CardHeader>
      <CardContent>
        <Stack dir="col" scale="sm">
          <span element="type--heading2" data-testid="platform-balance">
            {credits(summary.balance)}
          </span>
          <span element="type--body-small" emphasis="quiet">
            for everything on the platform, in lots that have not expired
          </span>
          {summary.limited.length > 0 && (
            <Stack dir="col" scale="2xs" data-testid="limited-balances">
              <span element="type--body-small" emphasis="quiet">
                For some services only
              </span>
              {summary.limited.map((l) => (
                <Stack key={l.services.join()} dir="row" scale="sm" justify="between">
                  <span element="type--body">{servicesLabel(l.services, serviceName)}</span>
                  <span element="type--body">{credits(l.amount)}</span>
                </Stack>
              ))}
            </Stack>
          )}
          {summary.vendorBalances.length > 0 && (
            <Stack dir="col" scale="2xs" data-testid="vendor-balances">
              <span element="type--body-small" emphasis="quiet">
                At vendors, for their products only
              </span>
              {summary.vendorBalances.map((v) => (
                <Stack key={v.vendorOrganizationId} dir="row" scale="sm" justify="between">
                  <span element="type--body">{v.vendorName}</span>
                  <span element="type--body">{credits(v.amount)}</span>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
