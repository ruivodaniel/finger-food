/**
 * What the app hands the slice at mount: its http client and where the
 * slice's endpoints hang, its query client (so commands refresh what they
 * changed), its router and its toast.
 */

import type { QueryClient } from "@tanstack/react-query";
import { configureHttp, type ImplementationPatternsHttp } from "../api/http";

export type { ImplementationPatternsHttp } from "../api/http";

export interface RouterAdapter {
  navigate: (options: { to: string; replace?: boolean }) => void | Promise<void>;
}

export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface MountImplementationPatternsWebOptions {
  http: ImplementationPatternsHttp;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
  queryClient: QueryClient;
  router?: RouterAdapter;
  toast?: ToastAdapter;
}

type Adapters = Omit<MountImplementationPatternsWebOptions, "http" | "clientPath">;

let adapters: Adapters | null = null;

/** Wire the slice's services to the app. Call once, before the first render. */
export function mountImplementationPatternsWeb({ http, clientPath, ...rest }: MountImplementationPatternsWebOptions): void {
  configureHttp(http, clientPath);
  adapters = rest;
}

export function mounted(): Adapters {
  if (!adapters) throw new Error("implementation patterns web is not mounted: call mountImplementationPatternsWeb first");
  return adapters;
}
