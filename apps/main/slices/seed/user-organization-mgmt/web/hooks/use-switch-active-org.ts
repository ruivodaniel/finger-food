/**
 * useSwitchActiveOrg — make an org the caller's active organization. The
 * client store changes (the api client sends it as the context header from
 * now on), and the session refetch carries the new activeOrganizationId,
 * which re-keys the page (the host's account layout keys its slot on it) —
 * the whole page remounts. Every cached answer was given under the old
 * context, so all of them are dropped (dropCachedAnswers): the remount starts
 * from loading states instead of flashing the previous org's rows. Only the
 * session stays, refetching.
 *
 * Resolves once the session carries the new active org, so a caller can
 * navigate into the org right after.
 */

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { setActiveOrgId } from "../lib/active-org";
import { dropCachedAnswers } from "../lib/drop-cached-answers";
import { queryKeys } from "../lib/query-keys";

export function useSwitchActiveOrg(): (organizationId: string) => Promise<void> {
  const queryClient = useQueryClient();
  return React.useCallback(
    async (organizationId: string) => {
      setActiveOrgId(organizationId);
      dropCachedAnswers(queryClient);
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
    [queryClient],
  );
}
