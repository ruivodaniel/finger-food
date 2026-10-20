/**
 * Gate guard for the signed-in shell — the client half of the module's
 * unmet-requirements gate. Attached to the account layout, so EVERY signed-in
 * page is gated by default: on navigation (not preload) it probes
 * `gate/check` (cached briefly); when the gate answers 428 the caller is
 * redirected to /resolve with the blocked page as `?intention=` (the same
 * return-path convention login uses).
 *
 * Two carve-outs, both in the guard itself — never in tree placement:
 * - `/resolve` (pathname self-check): the wizard that clears obligations can
 *   never bounce to itself. The server-side mirror is its gate excludePaths
 *   (/me, /legal/): the ENDPOINTS that clear obligations stay reachable
 *   while blocked, even though every PAGE is gated.
 * - a 401 probe (signed out): the gate is a signed-in concern — the caller
 *   is sent to login carrying the blocked page as `?intention=`.
 */

import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import {
  ApiError,
  userOrgMgmtQueryKeys,
  type UserOrgMgmtApiClient,
} from "@modules/user-organization-mgmt/web";

const GATE_CHECK_STALE_TIME_MS = 5_000;

type GateBeforeLoadArgs = {
  location: { pathname: string; searchStr?: string };
  context: { queryClient: Pick<QueryClient, "fetchQuery"> };
  preload?: boolean;
};

export function createGateBeforeLoad(
  client: UserOrgMgmtApiClient,
  options?: { resolvePath?: string; loginPath?: string },
) {
  const resolvePath = options?.resolvePath ?? "/resolve";
  const loginPath = options?.loginPath ?? "/login";

  return async function gateBeforeLoad({
    location,
    context,
    preload,
  }: GateBeforeLoadArgs) {
    if (preload) return;
    if (location.pathname === resolvePath) return;

    const intention = location.pathname + (location.searchStr ?? "");

    let gate;
    try {
      gate = await context.queryClient.fetchQuery({
        queryKey: userOrgMgmtQueryKeys.gate,
        queryFn: () => client.gateCheck(),
        staleTime: GATE_CHECK_STALE_TIME_MS,
        // The app's query default still retries network failures and 5xx —
        // navigation must fail fast instead of stalling on the guard.
        retry: false,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        throw redirect({
          to: loginPath as never,
          search: { intention } as never,
        });
      }
      throw e;
    }

    if ("obligations" in gate && gate.obligations.length > 0) {
      throw redirect({
        to: resolvePath as never,
        search: { intention } as never,
      });
    }
  };
}
