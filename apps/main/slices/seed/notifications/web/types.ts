import type { IconName } from "@libs/web-components";
// Web-surface types — the module's frontend config and adapter contracts.

import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode, ComponentType } from "react";

export interface NotificationsWebConfig {
  /** API origin, e.g. http://localhost:3000 (no trailing slash). */
  apiBaseUrl: string;
  /** Domain surface base path — matches where the app mounts the router. */
  clientPath?: string;
  /** How often the bell re-checks for new rows, in ms (default 60s). */
  pollIntervalMs?: number;
}

/** Toast adapter — optional user feedback. */
export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

/** What an empty state takes. The app injects its own; the module ships a plain default. */
export interface EmptyStateComponentProps {
  kind?: "nothing-yet" | "no-results" | "unavailable";
  title: string;
  description?: ReactNode;
  icon?: IconName;
  /** sm: inside a popover or a card */
  scale?: "sm" | "md";
  testId?: string;
}

/** Shared components the app injects. Each is optional: the module falls back to its own default. */
export interface NotificationsComponents {
  EmptyState: ComponentType<EmptyStateComponentProps>;
}

export interface NotificationsProviderProps {
  config: NotificationsWebConfig;
  queryClient?: QueryClient;
  toast?: ToastAdapter;
  components?: Partial<NotificationsComponents>;
  children: ReactNode;
}
