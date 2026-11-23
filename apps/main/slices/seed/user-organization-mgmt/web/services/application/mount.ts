/**
 * What the app hands the module at mount: its http client and where the
 * module's surfaces hang, its query client, its router and toast, and the two
 * pieces of product policy the module renders without owning (the role
 * catalog, the preferences policy).
 */

import type { QueryClient } from "@tanstack/react-query";
import type { PreferencesPolicy } from "../../../shared/types/preferences";
import { configureHttp, type HttpPaths, type UserOrgMgmtHttp } from "../api/http";
import { createGateBlockedHandler } from "../../shared/helpers/gate-blocked";
import { onboardingService } from "./onboarding.service";

export type { UserOrgMgmtHttp } from "../api/http";

/** A role a selector may assign — value plus its display info. */
export interface RoleOption {
  value: string;
  label: string;
  description?: string;
}

/** Router adapter — the app's router, reduced to what pages need. */
export interface RouterAdapter {
  navigate: (options: {
    to: string;
    search?: Record<string, unknown>;
    /** Replace the current history entry (a hand-off, not a step). */
    replace?: boolean;
  }) => void | Promise<void>;
  currentPath?: () => string;
}

/** Toast adapter — optional user feedback. */
export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface MountUserOrgMgmtWebOptions extends HttpPaths {
  http: UserOrgMgmtHttp;
  queryClient: QueryClient;
  router?: RouterAdapter;
  toast?: ToastAdapter;
  /**
   * The membership roles the org UIs may assign, keyed by org type. The app
   * supplies it from its access-control config; the module stays AC-agnostic.
   * A type absent here (or an absent catalog) falls back to free-text entry.
   */
  roleCatalog?: Record<string, RoleOption[]>;
  /**
   * The product's preferences policy — which fields users may change, and
   * whether "follow the system" is offered. Without it every field shows as
   * set by the product.
   */
  preferences?: PreferencesPolicy;
}

type Adapters = Omit<MountUserOrgMgmtWebOptions, "http" | "authPath" | "clientPath">;

let adapters: Adapters | null = null;

/** Wire the module's services to the app. Call once, before the first render. */
export function mountUserOrgMgmtWeb({ http, authPath, clientPath, ...rest }: MountUserOrgMgmtWebOptions): void {
  adapters = rest;
  // A request blocked by the gate mid-session hands the caller to /resolve,
  // with the gate's answer already in the cache so the screen paints at once.
  const onGateBlocked = rest.router
    ? createGateBlockedHandler({
        navigate: rest.router.navigate,
        currentPath: rest.router.currentPath,
        seedGate: (obligations) => rest.queryClient.setQueryData(onboardingService.keys.gate, { obligations }),
      })
    : undefined;
  configureHttp(http, { authPath, clientPath }, onGateBlocked);
}

export function mounted(): Adapters {
  if (!adapters) throw new Error("user-organization-mgmt web is not mounted: call mountUserOrgMgmtWeb first");
  return adapters;
}
