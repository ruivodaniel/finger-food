// Public web surface — what a consuming app imports. Pages travel inside route
// definitions; everything else under web/ is module-internal.

export {
  NotificationsProvider,
  useNotificationsContext,
} from "./providers/NotificationsProvider";
export { NotificationBell } from "./components/NotificationBell";
export { NotificationCenter } from "./components/NotificationCenter";
export { useNotificationInbox } from "./hooks/use-notification-inbox";
export type { NotificationInbox } from "./hooks/use-notification-inbox";
export { useNotificationPreferences } from "./hooks/use-notification-preferences";
export type { NotificationPreferences } from "./hooks/use-notification-preferences";
export { getNotificationsRoutes } from "./routes/get-routes";
export type { GetRoutesOptions } from "./routes/get-routes";
export type {
  RouteDefinition,
  RouteAccess,
  RouteContext,
} from "./routes/route-definition";
export { createApiClient, ApiError, isUnavailable } from "./lib/api-client";
export type { NotificationsApiClient } from "./lib/api-client";
export { queryKeys as notificationsQueryKeys } from "./lib/query-keys";
export type {
  NotificationsWebConfig,
  NotificationsProviderProps,
  ToastAdapter,
} from "./types";
