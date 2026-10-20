/**
 * NotificationsProvider — the module's flat-bag context.
 *
 * Builds the module-owned API client from the injected config and exposes it
 * with the app's adapters. Apps mount this once above anything that shows a
 * notification:
 *
 * ```tsx
 * <NotificationsProvider config={{ apiBaseUrl }} queryClient={qc}>
 *   …
 * </NotificationsProvider>
 * ```
 */

import * as React from "react";
import { createApiClient, type NotificationsApiClient } from "../lib/api-client";
import type {
  NotificationsComponents,
  NotificationsProviderProps,
  NotificationsWebConfig,
  ToastAdapter,
} from "../types";
import type { QueryClient } from "@tanstack/react-query";

export interface NotificationsContextValue {
  config: NotificationsWebConfig;
  client: NotificationsApiClient;
  queryClient?: QueryClient;
  toast?: ToastAdapter;
  components?: Partial<NotificationsComponents>;
}

const NotificationsContext =
  React.createContext<NotificationsContextValue | null>(null);

/** Read the module's flat-bag context. Consumers destructure what they need. */
export function useNotificationsContext(): NotificationsContextValue {
  const context = React.useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotificationsContext must be used within a NotificationsProvider",
    );
  }
  return context;
}

export function NotificationsProvider({
  config,
  queryClient,
  toast,
  components,
  children,
}: NotificationsProviderProps): React.ReactElement {
  const value = React.useMemo<NotificationsContextValue>(
    () => ({ config, client: createApiClient(config), queryClient, toast, components }),
    [config, queryClient, toast, components],
  );
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
