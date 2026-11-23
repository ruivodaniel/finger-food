// Public web surface — what a consuming app imports. Pages travel inside the
// route declaration; everything else under web/ is slice-internal.

export { mountNotificationsWeb } from "./services/application/mount";
export type { MountNotificationsWebOptions, NotificationsHttp, ToastAdapter } from "./services/application/mount";
export { NotificationBell } from "./shared/components/NotificationBell";
export { NotificationCenter } from "./shared/components/NotificationCenter";
export { getNotificationsRoutes } from "./routes/get-routes";
// The page another slice places in its section (user-organization-mgmt: the caller's settings).
export { NotificationPreferencesPage } from "./pages/notification-preferences/NotificationPreferencesPage";
