/**
 * UserOrgMgmtProvider — the module's flat-bag context.
 *
 * Builds the module-owned API client from the injected config and exposes
 * it with the app adapters (queryClient, router, toast). Apps mount this
 * once above the module's routes:
 *
 * ```tsx
 * <UserOrgMgmtProvider config={{ apiBaseUrl }} queryClient={qc} router={r}>
 *   ...
 * </UserOrgMgmtProvider>
 * ```
 */

import * as React from "react";
import { createApiClient, type UserOrgMgmtApiClient } from "../lib/api-client";
import { createGateBlockedHandler } from "../lib/gate-blocked";
import { queryKeys } from "../lib/query-keys";
import { useResetOnIdentityChange } from "../hooks/use-reset-on-identity-change";
import type {
  RouterAdapter,
  ToastAdapter,
  UserOrgMgmtComponents,
  UserOrgMgmtProviderProps,
  UserOrgMgmtWebConfig,
} from "../types";
import type { QueryClient } from "@tanstack/react-query";

export interface UserOrgMgmtContextValue {
  config: UserOrgMgmtWebConfig;
  client: UserOrgMgmtApiClient;
  queryClient?: QueryClient;
  router?: RouterAdapter;
  toast?: ToastAdapter;
  components?: Partial<UserOrgMgmtComponents>;
}

const UserOrgMgmtContext = React.createContext<UserOrgMgmtContextValue | null>(
  null,
);

/** Read the module's flat-bag context. Pages destructure what they need. */
export function useUserOrgMgmtContext(): UserOrgMgmtContextValue {
  const context = React.useContext(UserOrgMgmtContext);
  if (!context) {
    throw new Error(
      "useUserOrgMgmtContext must be used within a UserOrgMgmtProvider",
    );
  }
  return context;
}

export function UserOrgMgmtProvider({
  config,
  queryClient,
  router,
  toast,
  components,
  children,
}: UserOrgMgmtProviderProps): React.ReactElement {
  const value = React.useMemo<UserOrgMgmtContextValue>(() => {
    const onGateBlocked = router
      ? createGateBlockedHandler({
          navigate: router.navigate,
          currentPath: router.currentPath,
          seedGate: queryClient
            ? (obligations) =>
                queryClient.setQueryData(queryKeys.gate, { obligations })
            : undefined,
        })
      : undefined;
    return {
      config,
      client: createApiClient(config, { onGateBlocked }),
      queryClient,
      router,
      toast,
      components,
    };
  }, [config, queryClient, router, toast, components]);
  return (
    <UserOrgMgmtContext.Provider value={value}>
      <IdentityChangeReset />
      {children}
    </UserOrgMgmtContext.Provider>
  );
}

/** Forgets the previous caller's cached answers when the signed-in user changes. */
function IdentityChangeReset(): null {
  useResetOnIdentityChange();
  return null;
}
