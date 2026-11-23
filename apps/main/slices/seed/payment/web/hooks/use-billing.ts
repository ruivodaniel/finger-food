/**
 * The billing hooks — the owner's summary, purchases and payments, the two
 * Stripe-hosted doors (checkout, portal), and the return from them.
 *
 * A target is a scope plus, for an organization, its id; the id travels in
 * the request header. A 401/428 is a state (nothing to show), a 403 is a
 * state too (the caller does not manage this account) — neither is retried.
 */

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingScope } from "../../shared/types";
import { ApiError, type CheckoutItem } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { usePaymentContext } from "../services/application/mount";

export interface BillingTarget {
  scope: BillingScope;
  /** the organization, for `scope: "organization"`; null while unresolved */
  organizationId: string | null;
}

const ready = (t: BillingTarget) => t.scope === "account" || t.organizationId != null;
const orgOf = (t: BillingTarget) => t.organizationId ?? undefined;
const notAState = (failureCount: number, error: unknown) => !(error instanceof ApiError) && failureCount < 2;

export function useBillingSummary(target: BillingTarget, options: { poll?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.summary(target.scope, target.organizationId),
    queryFn: () => client.summary(target.scope, orgOf(target)),
    enabled: ready(target),
    retry: notAState,
    // the webhook may land after the browser is back from Checkout: look again for a short while
    refetchInterval: options.poll ? 2_000 : false,
  });
}

export function usePurchases(target: BillingTarget, page: { page: number; pageSize: number }) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.purchases(target.scope, target.organizationId, page.page),
    queryFn: () => client.purchases(target.scope, page, orgOf(target)),
    enabled: ready(target),
    retry: notAState,
    placeholderData: (previous) => previous,
  });
}

export function usePayments(target: BillingTarget, page: { page: number; pageSize: number }, options: { poll?: boolean } = {}) {
  const { client } = usePaymentContext();
  return useQuery({
    queryKey: queryKeys.payments(target.scope, target.organizationId, page.page),
    queryFn: () => client.payments(target.scope, page, orgOf(target)),
    enabled: ready(target),
    retry: notAState,
    placeholderData: (previous) => previous,
    refetchInterval: options.poll ? 2_000 : false,
  });
}

/** The two doors to Stripe: both answer a URL the browser is sent to. A failure is a toast. */
export function useStripeDoors(target: BillingTarget) {
  const { client, toast } = usePaymentContext();
  const leave = (url: string) => {
    window.location.assign(url);
  };
  const onError = (error: unknown) => {
    toast?.error(error instanceof ApiError ? error.message : "Something went wrong — please try again.");
  };
  const checkout = useMutation({
    mutationFn: (item: CheckoutItem) => client.checkout(target.scope, item, orgOf(target)),
    onSuccess: ({ url }) => leave(url),
    onError,
  });
  const portal = useMutation({
    mutationFn: () => client.portal(target.scope, orgOf(target)),
    onSuccess: ({ url }) => leave(url),
    onError,
  });
  return {
    checkout: (item: CheckoutItem) => checkout.mutate(item),
    openPortal: () => portal.mutate(),
    busy: checkout.isPending || portal.isPending,
  };
}

/** Removes a one-time query parameter (`?checkout=`, `?onboarding=`) from the address bar without a navigation — the page read it once. */
export function stripSearchParam(name: string) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.delete(name);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

/**
 * The return from Checkout: `success` says the payment went through (the
 * webhook records it, usually before the browser is back — the page polls
 * for ten seconds to catch it when not); `cancel` says nothing was charged.
 */
export function useCheckoutReturn(result: string | undefined, successMessage = "Payment received — your credits will show in a moment."): { polling: boolean } {
  const { toast } = usePaymentContext();
  const queryClient = useQueryClient();
  const [polling, setPolling] = React.useState(result === "success");
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (!result || handled.current) return;
    handled.current = true;
    stripSearchParam("checkout");
    if (result === "success") {
      toast?.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: queryKeys.all });
      const timer = setTimeout(() => setPolling(false), 10_000);
      return () => clearTimeout(timer);
    }
    if (result === "cancel") toast?.info?.("Checkout cancelled — nothing was charged.");
    return undefined;
  }, [result, toast, queryClient, successMessage]);

  return { polling };
}
