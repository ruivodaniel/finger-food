/**
 * VendorCard — the organization's standing as a vendor on Stripe: not
 * started, onboarding incomplete, or able to take payments; and the doors to
 * Stripe: start or continue onboarding, open the Express dashboard (payouts,
 * money refunds and disputes live there).
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VendorStatus } from "../../shared/types";

export interface VendorCardProps {
  status: VendorStatus;
  platformFeePercent: number;
  onOnboarding: () => void;
  onDashboard: () => void;
  busy?: boolean;
}

export function VendorCard({ status, platformFeePercent, onOnboarding, onDashboard, busy }: VendorCardProps): React.ReactElement {
  const badge = !status.hasAccount
    ? { tone: "neutral" as const, label: "not started" }
    : status.chargesEnabled
      ? { tone: "success" as const, label: "can take payments" }
      : { tone: "warning" as const, label: "onboarding incomplete" };
  return (
    <Card className="flex-1 min-w-72" data-testid="vendor-card">
      <CardHeader>
        <Stack dir="row" align="center" scale="sm">
          <h3 element="type--heading4">Stripe account</h3>
          <Badge status={badge.tone} data-testid="vendor-status">
            {badge.label}
          </Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        <Stack dir="col" scale="sm">
          <Stack dir="row" scale="sm" wrap align="center">
            {!status.hasAccount && (
              <Button emphasis="primary" disabled={busy} onClick={onOnboarding} data-testid="start-onboarding">
                Start Stripe onboarding
              </Button>
            )}
            {status.hasAccount && !status.chargesEnabled && (
              <Button emphasis="primary" disabled={busy} onClick={onOnboarding} data-testid="continue-onboarding">
                Continue onboarding
              </Button>
            )}
            {status.hasAccount && (
              <Button emphasis="secondary" startIcon="link" buttonType="icon-text" disabled={busy} onClick={onDashboard} data-testid="open-dashboard">
                Open Stripe dashboard
              </Button>
            )}
          </Stack>
          <span element="type--body-small" emphasis="quiet">
            The platform keeps {platformFeePercent}% of each card sale. Stripe's processing fees and any money refund come out of your balance.
          </span>
        </Stack>
      </CardContent>
    </Card>
  );
}
