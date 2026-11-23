/**
 * SellingPage — an organization as a vendor: its Stripe standing with the
 * doors to onboarding and the Express dashboard, the credits it issued and
 * still owes, its products with the product sheet, and its sales, each
 * settleable in credits where the policy allows. The URL names the
 * organization (`current` aliases the active one); every request names it in
 * the header.
 *
 * Payouts, money refunds and disputes are Stripe's and open in the
 * dashboard. A member without Manage Billing is told the page is not theirs;
 * the server refuses them regardless.
 */

import * as React from "react";
import { Stack } from "@libs/web-layouts";
import type { BuyerView, ProductView, PurchaseView } from "../../shared/types";
import { ProductSheet } from "../components/ProductSheet";
import { ProductsTable } from "../components/ProductsTable";
import { SalesTable } from "../components/SalesTable";
import { VendorCard } from "../components/VendorCard";
import { VendorCreditsCard } from "../components/VendorCreditsCard";
import { VendorCreditsSheet, creditsAllowed, unsettledOf, type VendorCreditsMode } from "../components/VendorCreditsSheet";
import { useBuyers, useOnboardingReturn, useProducts, useSales, useSellingDoors, useVendor, useVendorCreditActions, useVendorCredits } from "../hooks/use-selling";
import { ApiError, isUnavailable } from "../lib/api-client";
import { usePaymentContext } from "../services/application/mount";

const PAGE_SIZE = 20;
// one empty list for every render, so the sheet's form isn't reset while buyers load
const NO_BUYERS: BuyerView[] = [];

export interface SellingPageProps {
  /** an organization id or the literal `current` */
  organizationId?: string;
  /** the return from Stripe onboarding: `return` | `refresh` */
  onboarding?: string;
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

export function SellingPage({ organizationId = "current", onboarding }: SellingPageProps): React.ReactElement | null {
  const { config, credits: creditsAdapter, activeOrganization } = usePaymentContext();
  const organization =
    organizationId === "current"
      ? activeOrganization
      : { id: organizationId, name: activeOrganization?.id === organizationId ? activeOrganization.name : "this organization" };
  const orgId = organization?.id ?? null;

  const vendor = useVendor(orgId);
  const doors = useSellingDoors(orgId);
  useOnboardingReturn(onboarding, orgId, doors.startOnboarding);
  const refused = vendor.error instanceof ApiError && (vendor.error.status === 403 || vendor.error.status === 400);
  const products = useProducts(orgId, { enabled: vendor.isSuccess });
  const [page, setPage] = React.useState(1);
  const sales = useSales(orgId, { page, pageSize: PAGE_SIZE }, { enabled: vendor.isSuccess });
  const buyers = useBuyers(orgId, { enabled: vendor.isSuccess });
  const credits = useVendorCredits(orgId, { enabled: vendor.isSuccess });
  const creditActions = useVendorCreditActions(orgId);
  const [editing, setEditing] = React.useState<ProductView | "new" | null>(null);
  const [settling, setSettling] = React.useState<VendorCreditsMode>(null);

  if (!organization) {
    return <Notice testId="selling-no-active-org" title="No active organization" body="Selling is done by an organization — pick one from the switcher." />;
  }
  if (isUnavailable(vendor.error)) return null;
  if (refused) {
    return <Notice testId="selling-forbidden" title={`Selling · ${organization.name}`} body={(vendor.error as ApiError).message || "You don't manage this organization's selling."} />;
  }
  if (vendor.isPending) return null;
  if (vendor.isError || !vendor.data) {
    return <Notice testId="selling-unavailable" title="Selling not available" body="Something went wrong loading this organization's standing — please try again." />;
  }

  const status = vendor.data;
  const currency = creditsAdapter.currency;
  const policyOf = (sale: PurchaseView) => products.rows.find((p) => p.id === sale.productId)?.refundPolicy ?? "money";
  const canSettle = (sale: PurchaseView) => creditsAllowed(sale, policyOf(sale)) && unsettledOf(sale) > 0 && sale.currency === currency;

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-4xl" data-testid="selling-page">
      <Stack dir="col" scale="2xs">
        <h2 element="type--heading3">Selling · {organization.name}</h2>
        <span element="type--body-small" emphasis="quiet">
          Your products on the Marketplace. Card payments, payouts and money refunds run on your own Stripe account.
        </span>
      </Stack>

      <Stack dir="row" scale="lg" wrap>
        <VendorCard
          status={status}
          platformFeePercent={config.catalog.marketplace.platformFeePercent}
          onOnboarding={doors.startOnboarding}
          onDashboard={doors.openDashboard}
          busy={doors.busy}
        />
        {credits.data && <VendorCreditsCard credits={credits.data} onPromote={() => setSettling({ kind: "promotion" })} busy={creditActions.busy} />}
      </Stack>

      <ProductsTable
        rows={products.rows}
        canCreate={status.chargesEnabled}
        onNew={() => setEditing("new")}
        onEdit={setEditing}
        onToggleActive={(p) => void products.updateProduct(p.id, { active: !p.active })}
        busy={products.busy}
      />

      <SalesTable
        rows={sales.data?.rows ?? []}
        total={sales.data?.total ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        canSettleInCredits={canSettle}
        onSettle={(sale) => setSettling({ kind: "refund", sale, refundPolicy: policyOf(sale) })}
      />

      <VendorCreditsSheet
        mode={settling}
        currency={currency}
        refundExpiresInDays={config.catalog.vendorCredits.refundExpiresInDays}
        buyers={buyers.data ?? NO_BUYERS}
        onClose={() => setSettling(null)}
        onCreditRefund={creditActions.creditRefund}
        onPromote={creditActions.promote}
        onMoneyRefund={doors.openDashboard}
        busy={creditActions.busy}
      />

      <ProductSheet
        editing={editing}
        currencies={config.catalog.marketplace.currencies}
        onClose={() => setEditing(null)}
        onSave={(input, product) => (product ? products.updateProduct(product.id, { ...input, description: input.description ?? null }) : products.createProduct(input))}
        busy={products.busy}
      />
    </Stack>
  );
}
