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
 * active org); only a CHANGE resets. Mounted once, by the module's provider.
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setActiveOrgId } from "../lib/active-org";
import { dropCachedAnswers } from "../lib/drop-cached-answers";
import { useSession } from "./use-session";

export function useResetOnIdentityChange(): void {
  const queryClient = useQueryClient();
  const { data } = useSession();
  // undefined until the first session settles; then the user's id, or null
  // when signed out.
  const userId = data === undefined ? undefined : (data.user?.id ?? null);
  const previous = React.useRef<string | null | undefined>(undefined);

  React.useEffect(() => {
    if (userId === undefined) return;
    if (previous.current !== undefined && previous.current !== userId) {
      setActiveOrgId(null);
      // The new user's first page is already asking (its route guard probes
      // the gate) by the time this runs — keep those fetches, drop the rest.
      dropCachedAnswers(queryClient, { keepInFlight: true });
    }
    previous.current = userId;
  }, [userId, queryClient]);
}
