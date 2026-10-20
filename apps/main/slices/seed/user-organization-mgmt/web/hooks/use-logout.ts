/**
 * useLogout — revoke the session (provider session + cookie), drop the
 * cached session state and the stored active org, and land on the app's
 * login page.
 */

import { useUserOrgMgmtContext } from "../providers/UserOrgMgmtProvider";
import { setActiveOrgId } from "../lib/active-org";
import { useInvalidateSession } from "./use-session";

export function useLogout(options?: { loginPath?: string; intention?: string }) {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();
  const loginPath = options?.loginPath ?? "/login";
  const intention = options?.intention;

  return async () => {
    await client.logout().catch(() => {
      // the session may already be dead server-side — still reset the client
    });
    setActiveOrgId(null);
    await invalidateSession();
    // intention: where login should land afterwards (LoginPage honors it) —
    // used when logout is a resolution step, not an exit.
    await router?.navigate(
      intention ? { to: loginPath, search: { intention } } : { to: loginPath },
    );
  };
}
