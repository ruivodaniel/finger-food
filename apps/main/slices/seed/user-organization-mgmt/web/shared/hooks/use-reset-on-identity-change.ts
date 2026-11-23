/**
 * useResetOnIdentityChange — when the signed-in user changes (sign-out,
 * sign-in, an expired session, another account on the same device), forget
 * everything cached for the previous one: every query but the session is
 * dropped and the stored active org is cleared — the OrgSwitcher then
 * self-heals to the new caller's first membership. Without it the next user
 * would see the previous user's memberships in the switcher and inherit
 * their active org until the cache went stale.
 *
 * The first settled session is the baseline (a reload keeps its cache and
 * active org); only a CHANGE resets. Called once, by the app's root.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { authenticationService } from "../../services/application/authentication.service";

export function useResetOnIdentityChange(): void {
  const { data } = useQuery(authenticationService.getSession());
  // undefined until the first session settles; then the user's id, or null
  // when signed out.
  const userId = data === undefined ? undefined : (data.user?.id ?? null);
  const previous = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (userId === undefined) return;
    if (previous.current !== undefined && previous.current !== userId) {
      authenticationService.resetForNewIdentity();
    }
    previous.current = userId;
  }, [userId]);
}
