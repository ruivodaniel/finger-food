/**
 * Who the caller is and how they sign in, out and back: the session, the auth
 * config the forms render from, the sign-in flows, recovery, and forgetting
 * everything cached when the caller changes.
 */

import { hashKey, queryOptions } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { clearActiveOrg } from "../../store/active-organization.store";
import { mounted } from "./mount";
import { onboardingService } from "./onboarding.service";
import { profileService } from "./profile.service";

export type { LoginResponse, SessionResponse } from "../api/auth.api";

type Intent = "registration" | "authentication" | "recovery";

const keys = {
  session: ["uom", "session"] as const,
  authConfig: (intent: string, identifier?: string) => ["uom", "auth-config", intent, identifier ?? null] as const,
};

/**
 * Drop every cached query except the session — the answers given to a caller
 * or an active org that no longer holds (an org switch, a different user
 * signed in, or none). Removed, not invalidated: nothing renders them again,
 * and whatever mounts next asks afresh. Covers every module's queries, so no
 * query has to be listed anywhere to be safe.
 *
 * `keepInFlight` spares queries fetching right now. Removing one cancels it,
 * and whoever awaits it (a route guard's fetchQuery) gets a CancelledError —
 * so a reset that runs after the new state has already started asking (a
 * sign-in, while the next page's guard probes the gate) keeps those fetches:
 * they were started for the new state.
 */
export function dropCachedAnswers(options: { keepInFlight?: boolean } = {}): void {
  const sessionHash = hashKey(keys.session);
  mounted().queryClient.removeQueries({
    predicate: (q) => q.queryHash !== sessionHash && !(options.keepInFlight && q.state.fetchStatus === "fetching"),
  });
}

export const authenticationService = {
  keys,

  /** `{ user: null, session: null }` means signed out — a settled state, not an error. */
  getSession: () => queryOptions({ queryKey: keys.session, queryFn: () => authApi.getSession(), staleTime: 10_000 }),

  /** `identifier` narrows the config to one identifier ("" keeps its own cache entry, as the forms key it). */
  getAuthConfig: (intent: Intent, identifier?: string) =>
    queryOptions({
      queryKey: keys.authConfig(intent, identifier),
      queryFn: () => authApi.getAuthConfig({ intent, identifier: identifier || undefined }),
    }),

  /** Refresh what a sign-in, sign-out or completed step changes: the session, the profile, the gate. */
  refreshSession: () =>
    Promise.all([
      mounted().queryClient.invalidateQueries({ queryKey: keys.session }),
      mounted().queryClient.invalidateQueries({ queryKey: profileService.keys.me }),
      mounted().queryClient.invalidateQueries({ queryKey: onboardingService.keys.gate }),
    ]),

  signInWithPassword: authApi.loginPassword,
  startCodeSignIn: authApi.loginCodeStart,
  completeCodeSignIn: authApi.loginCodeComplete,
  startRecovery: authApi.recoveryStart,
  completeRecovery: authApi.recoveryComplete,
  finishRecovery: authApi.recoveryFinish,

  /**
   * Revoke the session (provider session + cookie), drop the cached session
   * state and the stored active org, and land on the app's login page.
   * `intention`: where login should land afterwards — used when signing out
   * is a resolution step, not an exit.
   */
  signOut: async (options?: { loginPath?: string; intention?: string }) => {
    const loginPath = options?.loginPath ?? "/login";
    await authApi.logout().catch(() => {
      // the session may already be dead server-side — still reset the client
    });
    clearActiveOrg();
    await authenticationService.refreshSession();
    await mounted().router?.navigate(
      options?.intention ? { to: loginPath, search: { intention: options.intention } } : { to: loginPath },
    );
  },

  /**
   * The signed-in user changed (sign-out, sign-in, an expired session, another
   * account on the same device): forget everything cached for the previous
   * one and clear the stored active org. The new user's first page is already
   * asking (its route guard probes the gate) by the time this runs — keep
   * those fetches, drop the rest.
   */
  resetForNewIdentity: () => {
    clearActiveOrg();
    dropCachedAnswers({ keepInFlight: true });
  },
};
