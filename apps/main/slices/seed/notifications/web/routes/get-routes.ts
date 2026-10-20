/**
 * Route contributions — the module's pages as data. The app mounts them under
 * its own layouts; the path here is where the seed hangs them.
 */

import { NotificationPreferencesPage } from "../pages/NotificationPreferencesPage";
import type { RouteDefinition } from "./route-definition";

export interface GetRoutesOptions {
  /** Where the preferences screen lives (default /my/settings/notifications). */
  preferencesPath?: string;
}

export function getNotificationsRoutes(
  options: GetRoutesOptions = {},
): RouteDefinition[] {
  const { preferencesPath = "/my/settings/notifications" } = options;

  return [
    {
      path: preferencesPath,
      page: NotificationPreferencesPage,
      access: "authenticated",
      meta: { title: "Notifications" },
    },
  ];
}
