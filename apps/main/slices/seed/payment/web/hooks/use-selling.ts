/**
 * The selling hooks — an organization as a vendor: its Stripe standing, the
 * two Stripe-hosted doors (onboarding, the Express dashboard), its products,
 * its sales and its buyers, and the return from onboarding.
 *
 * Every call names the organization in the request header. A 403 is a state
 * (the caller does not manage this organization's selling), never retried.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaymentOwner } from "../../shared/types";
import { ApiError, type ProductChange, type ProductInput } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { usePaymentContext } from "../services/application/mount";
import { stripSearchParam } from "./use-billing";

const notAState = (failureCount: number, error: unknown) => !(error instanceof ApiError) && failureCount < 2;

export function useVendor(organizationId: string | null) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.vendor(organizationId ?? ""),
    queryFn: () => client.vendor(organizationId as string),
    enabled: organizationId != null,
    retry: notAState,
  });
}

/** Onboarding and the Express dashboard: both answer a URL the browser is sent to. A failure is a toast. */
export function useSellingDoors(organizationId: string | null) {
  const { client, toast } = usePaymentContext();
  const onError = (error: unknown) => toast?.error(error instanceof ApiError ? error.message : "Something went wrong — please try again.");
  const leave = ({ url }: { url: string }) => window.location.assign(url);
  const onboarding = useMutation({ mutationFn: () => client.onboarding(organizationId as string), onSuccess: leave, onError });
  const dashboard = useMutation({ mutationFn: () => client.dashboard(organizationId as string), onSuccess: leave, onError });
  return {
    startOnboarding: () => onboarding.mutate(),
    openDashboard: () => dashboard.mutate(),
    busy: onboarding.isPending || dashboard.isPending,
  };
}

/**
 * The return from Stripe onboarding: `return` means the person left Stripe
 * (finished or not) — read the standing again; `refresh` means the link
 * expired — ask for a new one at once.
 */
export function useOnboardingReturn(result: string | undefined, organizationId: string | null, startOnboarding: () => void) {
  const queryClient = useQueryClient();
  const handled = React.useRef(false);
  React.useEffect(() => {
    if (!result || !organizationId || handled.current) return;
    handled.current = true;
    stripSearchParam("onboarding");
    if (result === "return") void queryClient.invalidateQueries({ queryKey: queryKeys.vendor(organizationId) });
    if (result === "refresh") startOnboarding();
  }, [result, organizationId, startOnboarding, queryClient]);
}

export function useProducts(organizationId: string | null, options: { enabled?: boolean } = {}) {
  const { client, toast } = usePaymentContext();
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: queryKeys.products(organizationId ?? ""),
    queryFn: () => client.products(organizationId as string),
    enabled: organizationId != null && options.enabled !== false,
    retry: notAState,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.all });
  const create = useMutation({
    mutationFn: (input: ProductInput) => client.createProduct(organizationId as string, input),
    onSuccess: () => void refresh(),
  });
  const update = useMutation({
    mutationFn: (input: { productId: string; change: ProductChange }) => client.updateProduct(organizationId as string, input.productId, input.change),
    onSuccess: () => void refresh(),
    onError: (error: unknown) => toast?.error(error instanceof ApiError ? error.message : "Something went wrong — please try again."),
  });
  return {
    rows: products.data ?? [],
    isPending: products.isPending,
    createProduct: (input: ProductInput) => create.mutateAsync(input),
    updateProduct: (productId: string, change: ProductChange) => update.mutateAsync({ productId, change }),
    busy: create.isPending || update.isPending,
  };
}

export function useSales(organizationId: string | null, page: { page: number; pageSize: number }, options: { enabled?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.sales(organizationId ?? "", page.page),
    queryFn: () => client.sales(organizationId as string, page),
    enabled: organizationId != null && options.enabled !== false,
    retry: notAState,
    placeholderData: (previous) => previous,
  });
}

/** Everyone who bought from the vendor, once each — who a promotion may go to. */
export function useBuyers(organizationId: string | null, options: { enabled?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.buyers(organizationId ?? ""),
    queryFn: () => client.buyers(organizationId as string),
    enabled: organizationId != null && options.enabled !== false,
    retry: notAState,
  });
}

/** What the vendor issued in its own credits, and who still holds some. */
export function useVendorCredits(organizationId: string | null, options: { enabled?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.vendorCredits(organizationId ?? ""),
    queryFn: () => client.vendorCredits(organizationId as string),
    enabled: organizationId != null && options.enabled !== false,
    retry: notAState,
  });
}

/** Settle a sale in the vendor's credits, or give a promotion. Both refresh everything the vendor sees. */
export function useVendorCreditActions(organizationId: string | null) {
  const { client, toast } = usePaymentContext();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.all });
  const creditRefund = useMutation({
    mutationFn: (input: { purchaseId: string; amount: number }) => client.creditRefund(organizationId as string, input.purchaseId, input.amount),
    onSuccess: () => {
      toast?.success("Credits issued — the buyer can spend them on your products.");
      void refresh();
    },
  });
  const promote = useMutation({
    mutationFn: (input: { owner: PaymentOwner; amount: number; expiresAt: string }) => client.promote(organizationId as string, input),
    onSuccess: () => {
      toast?.success("Promotion given.");
      void refresh();
    },
  });
  return {
    creditRefund: (purchaseId: string, amount: number) => creditRefund.mutateAsync({ purchaseId, amount }),
    promote: (input: { owner: PaymentOwner; amount: number; expiresAt: string }) => promote.mutateAsync(input),
    busy: creditRefund.isPending || promote.isPending,
  };
}
