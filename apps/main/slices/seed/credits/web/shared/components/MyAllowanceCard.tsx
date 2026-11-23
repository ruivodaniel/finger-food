/**
 * MyAllowanceCard — the one piece of an organization's credits a member sees:
 * their own allocation in the organization they are acting in, with what was
 * spent, what is left and when it renews, or the fact that no rule applies.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, EmptyState } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { Allowance } from "../../../shared/types";
import { PERIOD_LABELS, UNSPENT_LABELS, credits, formatDate, servicesLabel } from "../helpers/format";

export interface MyAllowanceCardProps {
  organizationName: string | null;
  allowance: Allowance | null | undefined;
  /** names a catalog service */
  serviceName: (key: string) => string;
}

function Fact({ label, children, status }: { label: string; children: React.ReactNode; status?: "success" | "error" }) {
  return (
    <Stack dir="col" scale="3xs">
      <span element="type--body-small" emphasis="quiet">
        {label}
      </span>
      <span element="type--body" status={status}>
        {children}
      </span>
    </Stack>
  );
}

export function MyAllowanceCard({ organizationName, allowance, serviceName }: MyAllowanceCardProps): React.ReactElement {
  return (
    <Card data-testid="my-allowance-card">
      <CardHeader>
        <Stack dir="col" scale="3xs">
          <h3 element="type--heading4">{organizationName ? `In ${organizationName}` : "In your organization"}</h3>
          <span element="type--body-small" emphasis="quiet">
            What the organization lets you spend. Without a rule you share its credits.
          </span>
        </Stack>
      </CardHeader>
      <CardContent>
        {!organizationName ? (
          <EmptyState title="You're not acting in an organization." data-testid="my-allowance-no-org" />
        ) : allowance ? (
          <Stack dir="row" scale="xl" wrap data-testid="my-allowance">
            <Fact label="amount">
              {credits(allowance.credits)} {PERIOD_LABELS[allowance.period]}
            </Fact>
            <Fact label="unspent">{UNSPENT_LABELS[allowance.unspent]}</Fact>
            <Fact label="spend on">{servicesLabel(allowance.services, serviceName)}</Fact>
            <Fact label="spent">{credits(allowance.spent)}</Fact>
            <Fact label="left" status={allowance.remaining > 0 ? "success" : "error"}>
              {credits(allowance.remaining)}
            </Fact>
            <Fact label="renews">{formatDate(allowance.renewsAt)}</Fact>
          </Stack>
        ) : (
          <EmptyState title="No rule — you share the organization's credits." data-testid="my-allowance-none" />
        )}
      </CardContent>
    </Card>
  );
}
