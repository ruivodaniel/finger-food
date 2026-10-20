/**
 * Gate-blocked handler — what the client does when a request lands 428.
 *
 * The gate's contract has two client halves: route guards probe before a
 * navigation, and THIS handles the request-time half — a caller already on a
 * page whose fetch gets blocked (a republished document re-gates mid-session)
 * is taken to /resolve with the page they were on as ?intention=, the same
 * return-path convention the route guard uses.
 *
 * Pure logic, all dependencies injected — no window, no react, no fetch.
 */

import type { Obligation } from "../../shared/auth-config/resolver";
import type { RouterAdapter } from "../types";

export interface GateBlockedHandlerDeps {
  navigate: RouterAdapter["navigate"];
  /** Current pathname+search — where the caller was when blocked. */
  currentPath?: () => string;
  /** Seed the shared gate query so /resolve paints instantly. */
  seedGate?: (obligations: Obligation[]) => void;
  /** Where blocked callers land. */
  resolvePath?: string;
  /**
   * Pages a redirect must never interrupt. By default only the resolve
   * screen itself — resolution (and its interruptible state, like a TOTP
   * enrollment) lives there now, and a redirect onto the page the caller is
   * already on would destroy it. Matched on the pathname.
   */
  skipPathPrefixes?: string[];
}

/**
 * One handler per client: collapses a burst of parallel 428s (invalidated
 * queries × retries) into a single navigation via an in-flight latch, then
 * the skip-list suppresses everything fired from /resolve itself. Never
 * throws — the original ApiError must always reach the call site.
 */
export function createGateBlockedHandler(
  deps: GateBlockedHandlerDeps,
): (obligations: Obligation[]) => void {
  const resolvePath = deps.resolvePath ?? "/resolve";
  const skip = deps.skipPathPrefixes ?? [resolvePath];
  let navigating = false;

  return (obligations) => {
    if (navigating) return;
    try {
      const path = deps.currentPath?.();
      const pathname = path?.split("?")[0] ?? "";
      if (skip.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return;
      }
      deps.seedGate?.(obligations);
      // ?intention= carries only in-app paths — never a protocol-relative
      // ("//host") or absolute URL a crafted param could smuggle in.
      const intention =
        path && path.startsWith("/") && !path.startsWith("//")
          ? path
          : undefined;
      navigating = true;
      void Promise.resolve(
        deps.navigate({
          to: resolvePath,
          ...(intention ? { search: { intention } } : {}),
        }),
      )
        .catch(() => {
          // navigation failure is the router's problem — never ours to raise
        })
        .finally(() => {
          navigating = false;
        });
    } catch {
      navigating = false; // a handler bug never masks the original ApiError
    }
  };
}
