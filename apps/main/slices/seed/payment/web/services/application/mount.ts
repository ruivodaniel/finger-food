/**
 * What the app hands the slice at mount: its config, the credits adapter, the
 * active organization (as a hook: the session is user-organization-mgmt's),
 * its router and its toast. Everything under web/ reads them through
 * usePaymentContext.
 */

import { createPaymentApiClient, type PaymentApiClient } from "../../lib/api-client";
import type { ActiveOrganization, CreditsAdapter, MountPaymentWebOptions, PaymentWebConfig, ToastAdapter } from "../../types";

export interface PaymentContextValue {
  config: PaymentWebConfig;
  credits: CreditsAdapter;
  client: PaymentApiClient;
  activeOrganization: ActiveOrganization | null;
  /** always set: the app's router when it gave one, a plain navigation otherwise */
  navigate: (path: string) => void;
  toast?: ToastAdapter;
}

type Mounted = Omit<PaymentContextValue, "activeOrganization"> & Pick<MountPaymentWebOptions, "useActiveOrganization">;

let mounted: Mounted | null = null;

/** Wire the slice to the app. Call once, before the first render. */
export function mountPaymentWeb({ config, credits, useActiveOrganization, navigate, toast }: MountPaymentWebOptions): void {
  mounted = {
    config,
    credits,
    client: createPaymentApiClient(config),
    useActiveOrganization,
    navigate: navigate ?? ((path) => window.location.assign(path)),
    toast,
  };
}

export function usePaymentContext(): PaymentContextValue {
  if (!mounted) throw new Error("payment web is not mounted: call mountPaymentWeb first");
  const { useActiveOrganization, ...rest } = mounted;
  return { ...rest, activeOrganization: useActiveOrganization() };
}
