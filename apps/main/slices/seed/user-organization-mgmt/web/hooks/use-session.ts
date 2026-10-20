/**
 * useSession — the caller's session, react-query cached. `data` is null-safe:
 * `{ user: null, session: null }` means signed out (a settled state, not an
 * error). `useInvalidateSession` refreshes it after login/logout/step
 * completions.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { queryKeys } from "../lib/query-keys";
import type { SessionResponse } from "../lib/api-client";

export function useSession() {
  const { client } = useUserOrgMgmtContext();
  return useQuery<SessionResponse>({
    queryKey: queryKeys.session,
    queryFn: () => client.getSession(),
    staleTime: 10_000,
  });
}

export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.session }),
      queryClient.invalidateQueries({ queryKey: queryKeys.me }),
      queryClient.invalidateQueries({ queryKey: queryKeys.gate }),
    ]);
}
