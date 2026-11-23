/**
 * implementation patterns web wiring — the app's http client, query client, router and toast, handed to the slice once at
 * startup. Paths use the slice default (/api/client), matching where the app mounts the slice's router.
 */

import { toast } from "@libs/web-components";
import { mountImplementationPatternsWeb, type ImplementationPatternsHttp } from "@product/implementation-patterns/web";
import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

export function mountImplementationPatterns(deps: { http: ImplementationPatternsHttp; queryClient: QueryClient; router: AnyRouter }): void {
  mountImplementationPatternsWeb({
    http: deps.http,
    queryClient: deps.queryClient,
    router: {
      navigate: async (opts) => {
        await deps.router.navigate(opts as never);
      },
    },
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    },
  });
}
