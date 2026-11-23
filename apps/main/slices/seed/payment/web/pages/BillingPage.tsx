/**
 * BillingPage — one page, two scopes, for what is paid: the plan, bundles,
 * payments and purchases. `account` is the person's own (inside Settings);
 * `organization` is the organization's, for whoever manages its billing. The
 * URL names the organization (`current` aliases the active one); every
 * request targets that id in the header.
 *
 * Every money surface (checkout, plan change, card) is Stripe-hosted; the
 * buttons here only open them. The balance beside the plan is the credits
 * slice's, placed here through its public surface; the lots, the members'
 * allocations and the history are on that slice's Credits page.
 */

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import { CreditsBalance } from "@modules/credits/web";
import type { BillingScope } from "../../shared/types";
import { BundleGrid } from "../components/BundleGrid";
import { PastDueNotice } from "../components/PastDueNotice";
import { PaymentsTable } from "../components/PaymentsTable";
import { PlanCard } from "../components/PlanCard";
import { PurchasesTable } from "../components/PurchasesTable";
import { useBillingSummary, useCheckoutReturn, usePayments, usePurchases, useStripeDoors, type BillingTarget } from "../hooks/use-billing";
import { isForbidden, isUnavailable } from "../lib/api-client";
import { usePaymentContext } from "../services/application/mount";

const PAGE_SIZE = 20;

export interface BillingPageProps {
  scope: BillingScope;
  /** an organization id or the literal `current`; organization scope only */
  organizationId?: string;
  /** the return from Checkout: `success` | `cancel` */
  checkout?: string;
}

function Notice({ title, body, testId }: { title: string; body: string; testId: string }): React.ReactElement {
  return (
    <Stack dir="col" scale="sm" className="w-full max-w-3xl" data-testid={testId}>
      <h2 element="type--heading3">{title}</h2>
      <span element="type--body-small" emphasis="quiet">
        {body}
      </span>
    </Stack>
  );
}

export function BillingPage({ scope, organizationId = "current", checkout }: BillingPageProps): React.ReactElement | null {
  const { config, credits, activeOrganization } = usePaymentContext();
  const organization =
    scope === "organization"
      ? organizationId === "current"
        ? activeOrganization
        : { id: organizationId, name: activeOrganization?.id === organizationId ? activeOrganization.name : "this organization" }
      : null;
  const target: BillingTarget = { scope, organizationId: organization?.id ?? null };
  const ownerName = scope === "organization" ? (organization?.name ?? "the organization") : "you";

  const { polling } = useCheckoutReturn(checkout);
  const summary = useBillingSummary(target, { poll: polling });
  const [purchasePage, setPurchasePage] = React.useState(1);
  const purchases = usePurchases(target, { page: purchasePage, pageSize: PAGE_SIZE });
  const [paymentPage, setPaymentPage] = React.useState(1);
  const payments = usePayments(target, { page: paymentPage, pageSize: PAGE_SIZE }, { poll: polling });
  const doors = useStripeDoors(target);
  const forbidden = isForbidden(summary.error);

  if (scope === "organization" && !organization) {
    return <Notice testId="billing-no-active-org" title="No active organization" body="You're not acting in any organization — pick one from the switcher, or create or join one from Organizations." />;
  }
  if (isUnavailable(summary.error)) return null;
  if (forbidden) {
    return <Notice testId="billing-forbidden" title={`Billing · ${ownerName}`} body="You don't manage this organization's billing. What it lets you spend is on Credits; ask a billing manager for more." />;
  }
  if (summary.isPending) return null;
  if (summary.isError || !summary.data) {
    return <Notice testId="billing-unavailable" title="Billing not available" body="Something went wrong loading this account — please try again." />;
  }

  const s = summary.data;
  const plan = config.catalog.plans.find((p) => p.key === s.planKey) ?? null;

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-4xl" data-testid={scope === "account" ? "personal-billing-page" : "organization-billing-page"}>
      <Stack dir="col" scale="2xs">
        <h2 element="type--heading3">{scope === "account" ? "Billing" : `Billing · ${ownerName}`}</h2>
        <span element="type--body-small" emphasis="quiet">
          {scope === "account"
            ? "Your own plan, bundles and payments. What you do inside an organization is paid by that organization."
            : "The organization's plan, bundles and payments. What each member may spend is on Credits."}
        </span>
      </Stack>

      {s.subscriptionStatus === "past_due" && <PastDueNotice ownerName={ownerName} planName={plan?.name ?? "current"} onPortal={doors.openPortal} busy={doors.busy} />}

      <Stack dir="row" scale="lg" wrap>
        <PlanCard
          summary={s}
          catalog={config.catalog}
          credits={credits}
          onChoose={(planKey) => doors.checkout({ planKey })}
          onPortal={doors.openPortal}
          busy={doors.busy}
          testMode={config.stripeTestMode}
        />
        <CreditsBalance target={target} poll={polling} />
      </Stack>

      <BundleGrid bundles={config.catalog.bundles} onBuy={(bundleKey) => doors.checkout({ bundleKey })} busy={doors.busy} testMode={config.stripeTestMode} />

      <PaymentsTable rows={payments.data?.rows ?? []} total={payments.data?.total ?? 0} page={paymentPage} pageSize={PAGE_SIZE} onPageChange={setPaymentPage} />

      <PurchasesTable rows={purchases.data?.rows ?? []} total={purchases.data?.total ?? 0} page={purchasePage} pageSize={PAGE_SIZE} onPageChange={setPurchasePage} />
    </Stack>
  );
}
