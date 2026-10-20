/**
 * useNotificationInbox — the caller's in-app rows, their unseen count, and the
 * two things they can do to a row.
 *
 * "Nothing to show" is a STATE, not a failure. The endpoint answers 401 when
 * nobody is signed in and 428 when the app still wants something from this
 * caller first; either way the hook reports `isUnavailable`, the bell renders
 * nothing, and polling stops. That keeps the module free of any session or
 * gating dependency — it never imports whoever owns those.
 *
 * `isReady` exists for the same reason `ProfilePage` waits before rendering: on
 * first paint nothing is known yet, and a badge that appears then vanishes
 * reads as a bug.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isUnavailable } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useNotificationsContext } from "../providers/NotificationsProvider";
import type { NotificationInboxItem } from "../../shared/types";

const DEFAULT_POLL_INTERVAL_MS = 60_000;
const PAGE_SIZE = 20;

export interface NotificationInbox {
  items: NotificationInboxItem[];
  /** Delivered but not yet read — what the bell badges. */
  unseenCount: number;
  /** True when older rows exist beyond this page. */
  hasMore: boolean;
  /** False until the first answer settles, a decline included. */
  isReady: boolean;
  /** The server won't serve this caller: signed out, or preconditions unmet. */
  isUnavailable: boolean;
  markSeen: (deliveryId: string) => Promise<void>;
  dismiss: (deliveryId: string) => Promise<void>;
}

export function useNotificationInbox(): NotificationInbox {
  const { client, config } = useNotificationsContext();
  const queryClient = useQueryClient();
  const pollInterval = config.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  const query = useQuery({
    queryKey: queryKeys.inbox,
    queryFn: () => client.listInbox({ limit: PAGE_SIZE }),
    // A decline is an answer — don't retry it, and don't keep polling it.
    retry: (failureCount, error) => !isUnavailable(error) && failureCount < 2,
    refetchInterval: ({ state }) =>
      isUnavailable(state.error) ? false : pollInterval,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.inbox });

  const markSeen = useMutation({
    mutationFn: (deliveryId: string) => client.markSeen(deliveryId),
    onSuccess: invalidate,
  });
  const dismiss = useMutation({
    mutationFn: (deliveryId: string) => client.dismiss(deliveryId),
    onSuccess: invalidate,
  });

  const unavailable = isUnavailable(query.error);

  return {
    items: query.data?.items ?? [],
    unseenCount: query.data?.unseenCount ?? 0,
    hasMore: query.data !== undefined && query.data.nextCursor !== null,
    isReady: !query.isPending || unavailable,
    isUnavailable: unavailable,
    markSeen: async (deliveryId) => {
      await markSeen.mutateAsync(deliveryId);
    },
    dismiss: async (deliveryId) => {
      await dismiss.mutateAsync(deliveryId);
    },
  };
}
