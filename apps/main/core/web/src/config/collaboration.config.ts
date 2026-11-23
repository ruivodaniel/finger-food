/**
 * collaboration web wiring — the app's http client, query client and real-time connection, this page's client id and the
 * router, handed to the slice once at startup. Paths use the slice default (/api/client), matching where the app mounts the collaboration router.
 *
 * The client id is made once per page load and isn't kept in sessionStorage, since a duplicated tab copies that: each tab
 * is its own client, with its own leases and undo.
 */

import { mountCollaborationWeb, type CollaborationHttp, type CollaborationRealtime } from "@modules/collaboration/web";
import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

export function mountCollaboration(deps: { http: CollaborationHttp; queryClient: QueryClient; router: AnyRouter; realtime: CollaborationRealtime }): void {
  mountCollaborationWeb({
    http: deps.http,
    queryClient: deps.queryClient,
    realtime: deps.realtime,
    clientId: crypto.randomUUID(),
    navigate: (to) => void deps.router.navigate({ to } as never),
  });
}
