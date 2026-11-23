/**
 * Every type × channel switch for the caller.
 *
 * The list is complete by construction (the server fills in defaults for rows
 * nobody has touched) and each row says whether it is `editable`, so the screen
 * never has to know which types the product pins. A decline (401 signed out,
 * 428 preconditions unmet) is a state, not a failure — same posture as the inbox.
 */

import { queryOptions } from "@tanstack/react-query";
import type { NotificationPreferenceView, SetNotificationPreferenceInput } from "../../../shared/types";
import { isApiError, isUnavailable } from "../../shared/helpers/api-error";
import { preferencesApi } from "../api/preferences.api";
import { mounted } from "./mount";

const preferencesKey = ["notifications", "preferences"] as const;

export const preferencesService = {
  getPreferences: () =>
    queryOptions({
      queryKey: preferencesKey,
      queryFn: () => preferencesApi.list(),
      retry: (failureCount, error) => !isUnavailable(error) && failureCount < 2,
    }),

  setPreference: async (input: SetNotificationPreferenceInput): Promise<NotificationPreferenceView[]> => {
    try {
      const items = await preferencesApi.set(input);
      // The server answers with the whole list, so take it as the new truth
      // instead of refetching what we were just given.
      mounted().queryClient.setQueryData(preferencesKey, items);
      return items;
    } catch (error) {
      if (isApiError(error)) mounted().toast?.error(error.message);
      throw error;
    }
  },
};
