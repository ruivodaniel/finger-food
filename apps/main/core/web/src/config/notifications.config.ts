/**
 * notifications web wiring — the app's http client, query client and toast,
 * handed to the module once at startup. Paths use the module default
 * (/api/client), matching where the app mounts the notifications router.
 */

import { toast } from "@libs/web-components";
import { mountNotificationsWeb, type NotificationsHttp } from "@modules/notifications/web";
import type { QueryClient } from "@tanstack/react-query";

export function mountNotifications(deps: { http: NotificationsHttp; queryClient: QueryClient }): void {
  mountNotificationsWeb({
    ...deps,
    toast: {
      success: (msg) => toast.success(msg),
      error: (msg) => toast.error(msg),
    },
  });
}
