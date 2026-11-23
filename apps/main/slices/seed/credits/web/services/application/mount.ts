/**
 * What the app hands the slice at mount: its http client and where the slice's
 * endpoints hang, the catalog, the active organization (as a hook: the session
 * is another slice's), an organization's members, where to buy more credits
 * and its toast.
 */

import type { CreditsCatalog } from "../../../shared/catalog";
import type { CreditsTarget } from "../../shared/hooks/use-credits";
import { configureHttp, type CreditsHttp } from "../api/http";

export type { CreditsHttp } from "../api/http";

/** The organization the caller is acting in — the app reads it off its session. */
export interface ActiveOrganization {
  id: string;
  name: string;
}

/** One member of an organization, as the caps table names them. */
export interface MemberSummary {
  userId: string;
  name: string;
  /** a display label, e.g. "Owner" */
  role: string;
}

export interface ToastAdapter {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface MountCreditsWebOptions {
  http: CreditsHttp;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
  /** The request header the API reads the target organization from. */
  activeOrgHeader?: string;
  /** The product's catalog (`@configs/credits`): the currency and the services the screens name. */
  catalog: Pick<CreditsCatalog, "currency" | "services">;
  /** A hook: the organization the caller is acting in, null when none. */
  useActiveOrganization: () => ActiveOrganization | null;
  /** The organization's members, for the caps table — the app wires it from its directory. */
  listMembers?: (organizationId: string) => Promise<MemberSummary[]>;
  /** A hook: opens where the caller buys more credits for the target, or null when there is nowhere
   *  (no slice sells credits) or it isn't theirs to buy. The credits page shows "Buy credits" when it answers. */
  useBuyCredits?: (target: CreditsTarget) => (() => void) | null;
  toast?: ToastAdapter;
}

type Adapters = Omit<MountCreditsWebOptions, "http" | "clientPath" | "activeOrgHeader">;

let adapters: Adapters | null = null;

/** Wire the slice to the app. Call once, before the first render. */
export function mountCreditsWeb({ http, clientPath, activeOrgHeader, ...rest }: MountCreditsWebOptions): void {
  configureHttp(http, clientPath, activeOrgHeader);
  adapters = rest;
}

export function mounted(): Adapters {
  if (!adapters) throw new Error("credits web is not mounted: call mountCreditsWeb first");
  return adapters;
}
