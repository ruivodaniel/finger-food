/**
 * The marketplace hooks — the listing, one product, and the buy: a URL on
 * the vendor's Stripe Checkout the browser is sent to.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingScope } from "../../shared/types";
import { ApiError } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { usePaymentContext } from "../services/application/mount";

const notAState = (failureCount: number, error: unknown) => !(error instanceof ApiError) && failureCount < 2;

export function useMarketplace(query: { search: string; page: number; pageSize: number }) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.marketplace(query.search, query.page),
    queryFn: () => client.marketplace({ search: query.search || undefined, page: query.page, pageSize: query.pageSize }),
    retry: notAState,
    placeholderData: (previous) => previous,
  });
}

export function useMarketplaceProduct(productId: string, options: { poll?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.marketplaceProduct(productId),
    queryFn: () => client.marketplaceProduct(productId),
    retry: notAState,
    refetchInterval: options.poll ? 2_000 : false,
  });
}

/** The buy, for the scope's billing owner: the active organization, or the person with none. */
export function useBuy(scope: BillingScope, organizationId: string | null) {
  const { client, toast } = usePaymentContext();
  const buy = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) => client.buy(scope, input, organizationId ?? undefined),
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) toast?.error("Only a billing manager of this organization can buy for it.");
      else toast?.error(error instanceof ApiError ? error.message : "Something went wrong — please try again.");
    },
  });
  return { buy: (input: { productId: string; quantity: number }) => buy.mutate(input), busy: buy.isPending };
}

/** A buy paid in full with the credits the buyer holds at the vendor: immediate, no Stripe. */
export function usePayWithCredits(scope: BillingScope, organizationId: string | null) {
  const { client, credits, toast } = usePaymentContext();
  const queryClient = useQueryClient();
  const pay = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) => client.payWithCredits(scope, input, organizationId ?? undefined),
    onSuccess: () => {
      toast?.success("Paid with credits — the purchase is on the billing page.");
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
      credits.refresh();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 403) toast?.error("Only a billing manager of this organization can buy for it.");
      else toast?.error(error instanceof ApiError ? error.message : "Something went wrong — please try again.");
    },
  });
  return { payWithCredits: (input: { productId: string; quantity: number }) => pay.mutate(input), busy: pay.isPending };
}
