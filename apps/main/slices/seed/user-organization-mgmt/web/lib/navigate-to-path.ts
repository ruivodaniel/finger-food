/**
 * navigateToPath — navigate to an in-app path that may carry a query string.
 * The router adapter's `to` is a path pattern, so an embedded "?x=y" would be
 * swallowed or percent-encoded into the pathname; split it off and pass the
 * pairs as `search` instead. `sanitizeInAppPath` guards the values that reach
 * it: only in-app absolute paths — "//host" or absolute URLs would leave the
 * app.
 */

import type { RouterAdapter } from "../types";

/** In-app absolute path or nothing — rejects "//host" and non-"/" values. */
export function sanitizeInAppPath(
  path: string | null | undefined,
): string | undefined {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return undefined;
  return path;
}

export function navigateToPath(
  router: RouterAdapter | undefined,
  path: string,
): void | Promise<void> {
  const splitAt = path.indexOf("?");
  if (splitAt === -1) return router?.navigate({ to: path });
  const search: Record<string, unknown> = {};
  for (const [key, value] of new URLSearchParams(path.slice(splitAt + 1))) {
    search[key] = value;
  }
  return router?.navigate({ to: path.slice(0, splitAt), search });
}
