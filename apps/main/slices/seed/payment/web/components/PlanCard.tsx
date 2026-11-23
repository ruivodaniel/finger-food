/**
 * PlanCard — the owner's plan: its name, the credits each period, the
 * services it includes with what one unit costs, and the way into the
 * Customer portal while one is held. With none: the prices the owner pays
 * without a plan, and the catalog's plans to choose from. Every change to a
 * held plan happens in Stripe.
 */

import * as React from "react";
import { Badge, Button, Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tile } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { PaymentCatalog } from "../../shared/catalog";
import type { BillingSummary } from "../../shared/types";
import { LIVE_STATUSES, formatDate, plainCredits, statusBadge } from "../lib/format";
import type { CreditsAdapter } from "../types";
import { TestCardHint } from "./TestCardHint";

export interface PlanCardProps {
  summary: BillingSummary;
  catalog: Pick<PaymentCatalog, "plans">;
  credits: Pick<CreditsAdapter, "services" | "pricesFor">;
  onChoose: (planKey: string) => void;
  onPortal: () => void;
  busy?: boolean;
  /** Stripe runs in test mode: name the test card under the buttons */
  testMode?: boolean;
}

function Services({ credits, planKey, planName }: { credits: PlanCardProps["credits"]; planKey: string | null; planName: string }) {
  const prices = credits.pricesFor(planKey);
  return (
    <Table className="w-full" data-testid="plan-services">
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {credits.services.map((s) => {
          const price = prices[s.key];
          return (
            <TableRow key={s.key}>
              <TableCell>{s.name}</TableCell>
              <TableCell className="text-right">
                {price == null ? <span emphasis="quiet">not in {planName}</span> : price === 0 ? "included" : `${plainCredits(price)} per ${s.unit}`}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function PlanCard({ summary, catalog, credits, onChoose, onPortal, busy, testMode }: PlanCardProps): React.ReactElement {
  const held = summary.subscriptionStatus != null && LIVE_STATUSES.has(summary.subscriptionStatus);
  const plan = catalog.plans.find((p) => p.key === summary.planKey) ?? null;
  const badge = statusBadge(held ? summary.subscriptionStatus : null);

  return (
    <Card className="flex-1 min-w-72" data-testid="plan-card">
      <CardHeader>
        <Stack dir="row" align="center" scale="sm">
          <h3 element="type--heading4">Plan</h3>
          <Badge status={badge.tone} data-testid="plan-status">
            {badge.label}
          </Badge>
        </Stack>
      </CardHeader>
      <CardContent>
        {held ? (
          <Stack dir="col" scale="sm">
            <span element="type--heading3" data-testid="plan-name">
              {plan?.name ?? summary.planKey ?? "Plan"}
            </span>
            <span element="type--body-small" emphasis="quiet">
              {plan ? `${plainCredits(plan.credits)} each period` : "a plan this catalog does not know"}
              {summary.currentPeriodEnd ? ` · paid until ${formatDate(summary.currentPeriodEnd)}` : ""}
            </span>
            <Services credits={credits} planKey={summary.planKey} planName={plan?.name ?? "this plan"} />
            <Button emphasis="secondary" scale="sm" startIcon="link" buttonType="icon-text" disabled={busy} onClick={onPortal} data-testid="open-portal">
              Manage in Stripe
            </Button>
            {testMode && <TestCardHint />}
          </Stack>
        ) : (
          <Stack dir="col" scale="md">
            <Stack dir="col" scale="2xs">
              <span element="type--body-small" emphasis="quiet">
                Without a plan you pay these prices:
              </span>
              <Services credits={credits} planKey={null} planName="the free plan" />
            </Stack>
            <Stack dir="row" scale="sm" wrap>
              {catalog.plans.map((p) => (
                <Tile key={p.key} className="flex-1 min-w-36" data-testid={`plan-${p.key}`}>
                  <Stack dir="col" scale="2xs">
                    <span element="type--heading4">{p.name}</span>
                    <span element="type--body-small" emphasis="quiet">
                      {plainCredits(p.credits)} each period
                    </span>
                    {p.features?.map((f) => (
                      <span key={f} element="type--body-small" emphasis="quiet">
                        {f}
                      </span>
                    ))}
                    <Button emphasis="primary" scale="sm" disabled={busy} onClick={() => onChoose(p.key)} data-testid={`choose-plan-${p.key}`}>
                      Choose
                    </Button>
                  </Stack>
                </Tile>
              ))}
            </Stack>
            {testMode && <TestCardHint />}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
