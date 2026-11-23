/**
 * The caller's in-app rows, their unseen count, and the two things they can do
 * to a row.
 *
 * "Nothing to show" is a STATE, not a failure. The endpoint answers 401 when
 * nobody is signed in and 428 when the app still wants something from this
 * caller first; either way the read reports unavailable, the bell renders
 * nothing, and polling stops. That keeps the module free of any session or
 * gating dependency — it never imports whoever owns those.
 */

import { queryOptions } from "@tanstack/react-query";
import { isUnavailable } from "../../shared/helpers/api-error";
import { inboxApi } from "../api/inbox.api";
import { mounted } from "./mount";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const PAGE_SIZE = 20;

const inboxKey = ["notifications", "inbox"] as const;

const refresh = () => mounted().queryClient.invalidateQueries({ queryKey: inboxKey });

export const inboxService = {
  getInbox: () =>
    queryOptions({
      queryKey: inboxKey,
      queryFn: () => inboxApi.list({ limit: PAGE_SIZE }),
      // A decline is an answer — don't retry it, and don't keep polling it.
      retry: (failureCount, error) => !isUnavailable(error) && failureCount < 2,
      refetchInterval: ({ state }) =>
        isUnavailable(state.error) ? false : (mounted().pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS),
    }),

  markSeen: (deliveryId: string) => inboxApi.markSeen(deliveryId).then(refresh),

  dismiss: (deliveryId: string) => inboxApi.dismiss(deliveryId).then(refresh),
};
