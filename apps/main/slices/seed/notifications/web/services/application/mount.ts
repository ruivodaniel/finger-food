/**
 * What the app hands the module at mount: its http client and where the
 * module's endpoints hang, its query client (so commands can refresh what they
 * changed), its toast, and how often the bell polls.
 */

import type { QueryClient } from "@tanstack/react-query";
import { configureHttp, type NotificationsHttp } from "../api/http";

export type { NotificationsHttp } from "../api/http";

/** Toast adapter — optional user feedback. */
export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface MountNotificationsWebOptions {
  http: NotificationsHttp;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
  queryClient: QueryClient;
  toast?: ToastAdapter;
  /** How often the bell re-checks for new rows, in ms (default 60s). */
  pollIntervalMs?: number;
}

type Adapters = Omit<MountNotificationsWebOptions, "http" | "clientPath">;

let adapters: Adapters | null = null;

/** Wire the module's services to the app. Call once, before the first render. */
export function mountNotificationsWeb({ http, clientPath, ...rest }: MountNotificationsWebOptions): void {
  configureHttp(http, clientPath);
  adapters = rest;
}

export function mounted(): Adapters {
  if (!adapters) throw new Error("notifications web is not mounted: call mountNotificationsWeb first");
  return adapters;
}
