/**
 * payment web wiring — the slice's config and what it may not import itself:
 * the active organization off the uom session, the credits (their prices and
 * what an owner holds at vendors, from the credits slice), the app's router
 * and toast, handed over once at startup. The path uses the slice default
 * (/api/client), matching where the app mounts the payment router. Every
 * environment but production runs on the Stripe sandbox, so the pages name
 * the test card there.
 */

import { toast } from "@libs/web-components";
import { creditsCatalog } from "@configs/credits";
import { paymentCatalog } from "@configs/payment";
import { creditsQueryKeys, useCreditsSummary, type CreditsTarget } from "@modules/credits/web";
import { priceListFor } from "@modules/credits/shared";
import { mountPaymentWeb, type VendorHoldings } from "@modules/payment/web";
import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { Env } from "@/env";
import { useActiveOrganization } from "@/config/credits.config";

function useVendorHoldings(target: CreditsTarget): VendorHoldings | null {
  const { data } = useCreditsSummary(target);
  return data ? { currency: data.currency, vendors: data.vendorBalances } : null;
}

export function mountPayment(deps: { queryClient: QueryClient; router: AnyRouter }): void {
  mountPaymentWeb({
    config: { apiBaseUrl: Env.VITE_API_URL, catalog: paymentCatalog, stripeTestMode: Env.VITE_APP_ENVIRONMENT !== "production" },
    credits: {
      currency: creditsCatalog.currency,
      services: creditsCatalog.services,
      pricesFor: (planKey) => priceListFor(creditsCatalog, planKey),
      useVendorHoldings,
      refresh: () => void deps.queryClient.invalidateQueries({ queryKey: creditsQueryKeys.all }),
    },
    useActiveOrganization,
    navigate: (path) => void deps.router.navigate({ to: path } as never),
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
      info: (msg) => toast.info(msg),
    },
  });
}
