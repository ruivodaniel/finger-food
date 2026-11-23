/**
 * ProductPage — one product: its vendor, price and refund policy, a
 * quantity, and the ways to pay: by card through Checkout on the vendor's
 * Stripe account, or in full with the credits the buyer holds at this vendor
 * when they cover the price (never part of each). A withdrawn product, or a
 * vendor that cannot take card payments, shows the reason instead. The buyer
 * is the active organization, or the person when none is active. Back from
 * Checkout, the page says what happened; the purchase lands on the buyer's
 * billing page when Stripe reports it.
 */

import * as React from "react";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, CardHeader, Input } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { TestCardHint } from "../components/TestCardHint";
import { useCheckoutReturn } from "../hooks/use-billing";
import { useBuy, useMarketplaceProduct, usePayWithCredits } from "../hooks/use-marketplace";
import { ApiError, isUnavailable } from "../lib/api-client";
import { REFUND_POLICY_LABELS, money } from "../lib/format";
import { usePaymentContext } from "../services/application/mount";

export interface ProductPageProps {
  productId: string;
  /** the return from Checkout: `success` | `cancel` */
  checkout?: string;
}

export function ProductPage({ productId, checkout }: ProductPageProps): React.ReactElement | null {
  const { config, activeOrganization, credits } = usePaymentContext();
  useCheckoutReturn(checkout, "Payment received — the purchase shows on the billing page once Stripe confirms it.");
  const product = useMarketplaceProduct(productId);
  const scope = activeOrganization ? "organization" : "account";
  const organizationId = activeOrganization?.id ?? null;
  const { buy, busy: buying } = useBuy(scope, organizationId);
  const { payWithCredits, busy: paying } = usePayWithCredits(scope, organizationId);
  // what the buyer holds at vendors; a member who cannot see the account sees none, and cannot buy for it anyway
  const holdings = credits.useVendorHoldings({ scope, organizationId });
  const [quantity, setQuantity] = React.useState("1");
  const busy = buying || paying;

  if (isUnavailable(product.error)) return null;
  if (product.error instanceof ApiError && product.error.status === 404) {
    return (
      <Stack dir="col" scale="sm" className="w-full max-w-2xl" data-testid="product-not-found">
        <h2 element="type--heading3">Product not found</h2>
        <span element="type--body-small" emphasis="quiet">
          It may have been removed. Other products are in the Marketplace.
        </span>
      </Stack>
    );
  }
  if (product.isPending || !product.data) return null;

  const p = product.data;
  const units = Number(quantity);
  const validQuantity = Number.isInteger(units) && units >= 1 && units <= 100;
  const buyer = activeOrganization?.name || "yourself";
  const total = validQuantity ? p.unitAmount * units : 0;
  const held = p.currency === holdings?.currency ? (holdings.vendors.find((v) => v.vendorOrganizationId === p.organizationId)?.amount ?? 0) : 0;
  const creditsCover = held > 0 && validQuantity && held >= total;

  return (
    <Stack dir="col" scale="xl" className="w-full max-w-2xl" data-testid="product-page">
      <Card>
        <CardHeader>
          <Stack dir="col" scale="3xs">
            <Stack dir="row" align="center" scale="sm">
              <h2 element="type--heading3">{p.name}</h2>
              {!p.active && <Badge status="neutral">withdrawn</Badge>}
            </Stack>
            <span element="type--body-small" emphasis="quiet">
              by {p.vendorName}
            </span>
          </Stack>
        </CardHeader>
        <CardContent>
          <Stack dir="col" scale="lg">
            {p.description && <span element="type--body">{p.description}</span>}
            <span element="type--heading2" data-testid="product-price">
              {money(p.unitAmount, p.currency)}
            </span>
            <span element="type--body-small" emphasis="quiet">
              Refunds: {REFUND_POLICY_LABELS[p.refundPolicy]}, at {p.vendorName}'s choice.
            </span>
            {!p.active ? (
              <Alert status="info" data-testid="product-withdrawn">
                <AlertDescription>This product is no longer for sale.</AlertDescription>
              </Alert>
            ) : !p.vendorCanTakePayments && held < p.unitAmount ? (
              <Alert status="warning" data-testid="vendor-cannot-take-payments">
                <AlertDescription>This vendor cannot take payments right now.</AlertDescription>
              </Alert>
            ) : (
              <Stack dir="col" scale="md">
                <Stack dir="row" scale="md" align="end" wrap>
                  <Stack dir="col" scale="2xs" className="w-24">
                    <label element="type--body-small">Quantity</label>
                    <Input value={quantity} inputMode="numeric" onChange={setQuantity} data-testid="quantity" />
                  </Stack>
                  {p.vendorCanTakePayments && (
                    <Button
                      emphasis={creditsCover ? "secondary" : "primary"}
                      disabled={busy || !validQuantity}
                      onClick={() => buy({ productId: p.id, quantity: units })}
                      data-testid="buy"
                    >
                      Pay {validQuantity ? money(total, p.currency) : ""} by card
                    </Button>
                  )}
                  {creditsCover && (
                    <Button emphasis="primary" disabled={busy} onClick={() => payWithCredits({ productId: p.id, quantity: units })} data-testid="buy-with-credits">
                      Pay with {p.vendorName} credits
                    </Button>
                  )}
                </Stack>
                {held > 0 ? (
                  <span element="type--body-small" emphasis="quiet" data-testid="vendor-credits-line">
                    {activeOrganization?.name || "You"} {activeOrganization ? "holds" : "hold"} {money(held, p.currency)} at {p.vendorName}.{" "}
                    {creditsCover
                      ? "Paying with credits moves no money; the rest stays for next time."
                      : p.vendorCanTakePayments
                        ? "They do not cover this price, so this purchase is paid by card in full."
                        : "They do not cover this quantity, and the vendor cannot take card payments right now."}
                  </span>
                ) : (
                  <span element="type--body-small" emphasis="quiet">
                    You pay as {buyer} on {p.vendorName}'s Stripe page and come back here.
                  </span>
                )}
                {config.stripeTestMode && p.vendorCanTakePayments && <TestCardHint />}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
