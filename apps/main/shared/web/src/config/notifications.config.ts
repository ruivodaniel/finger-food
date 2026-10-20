/**
 * notifications web config — where the module's client finds its API surface.
 * The path uses the module default (/api/client), matching where the app mounts
 * the notifications router.
 */

import { Env } from "@/env";
import type { NotificationsWebConfig } from "@modules/notifications/web";

export const notificationsWebConfig: NotificationsWebConfig = {
  apiBaseUrl: Env.VITE_API_URL,
};
