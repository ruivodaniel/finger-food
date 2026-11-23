/**
 * The route declaration — this slice's pages as a tree of nodes, as data (@libs/web-routing). The paths are the ones
 * `shared/paths.ts` builds Stripe's return URLs from, so the two cannot drift. The person's billing lives in their settings,
 * a section the user-organization-mgmt slice owns: the app hands `personalBillingRoute` to that slice.
 */

import type { RouteContext, RouteNode } from "@libs/web-routing";
import { paymentPaths } from "../../shared/paths";
import { BillingPage } from "../pages/BillingPage";
import { MarketplacePage } from "../pages/MarketplacePage";
import { ProductPage } from "../pages/ProductPage";
import { SellingPage } from "../pages/SellingPage";
import { PaymentLayout } from "../shared/layouts/PaymentLayout";

/** A one-time query value Stripe sends the browser back with (`?checkout=`, `?onboarding=`). */
const searchOf = (ctx: RouteContext, key: string): string | undefined => (typeof ctx.search[key] === "string" ? (ctx.search[key] as string) : undefined);

/** `$organizationId` is an id or the literal `current` (the active organization). */
const organizationOf = (ctx: RouteContext): string => ctx.params.organizationId ?? "current";

/** The person's own billing, as a child of the settings section. */
export const personalBillingRoute: RouteNode = {
  path: paymentPaths.personalBilling.split("/").pop(),
  page: BillingPage,
  makeProps: (ctx) => ({ scope: "account", checkout: searchOf(ctx, "checkout") }),
  nav: { title: "Billing" },
};

export function getPaymentRoutes(): RouteNode[] {
  return [
    {
      access: "gated",
      id: "payment",
      layout: PaymentLayout,
      children: [
        {
          path: paymentPaths.organizationBilling("$organizationId"),
          page: BillingPage,
          makeProps: (ctx) => ({ scope: "organization", organizationId: organizationOf(ctx), checkout: searchOf(ctx, "checkout") }),
        },
        {
          path: paymentPaths.selling("$organizationId"),
          page: SellingPage,
          makeProps: (ctx) => ({ organizationId: organizationOf(ctx), onboarding: searchOf(ctx, "onboarding") }),
        },
        { path: paymentPaths.marketplace, page: MarketplacePage, makeProps: () => ({}) },
        {
          path: paymentPaths.product("$productId"),
          page: ProductPage,
          makeProps: (ctx) => ({ productId: ctx.params.productId ?? "", checkout: searchOf(ctx, "checkout") }),
        },
      ],
    },
  ];
}
