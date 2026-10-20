/**
 * Drop every cached query except the session — the answers given to a caller
 * or an active org that no longer holds (an org switch, a different user
 * signed in, or none). Removed, not invalidated: nothing renders them again,
 * and whatever mounts next asks afresh. Covers every module's queries, so no
 * query has to be listed anywhere to be safe.
 *
 * `keepInFlight` spares queries fetching right now. Removing one cancels it,
 * and whoever awaits it (a route guard's fetchQuery) gets a CancelledError —
 * so a reset that runs after the new state has already started asking (a
 * sign-in, while the next page's guard probes the gate) keeps those fetches:
 * they were started for the new state.
 */

import { hashKey, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

export function dropCachedAnswers(
  queryClient: QueryClient,
  options: { keepInFlight?: boolean } = {},
): void {
  const sessionHash = hashKey(queryKeys.session);
  queryClient.removeQueries({
    predicate: (q) =>
      q.queryHash !== sessionHash &&
      !(options.keepInFlight && q.state.fetchStatus === "fetching"),
  });
}
