/**
 * useNotificationPreferences — every type × channel switch for the caller.
 *
 * The list is complete by construction (the server fills in defaults for rows
 * nobody has touched) and each row says whether it is `editable`, so the screen
 * never has to know which types the product pins.
 *
 * A decline (401 signed out, 428 preconditions unmet) is a state, not a
 * failure — same posture as the inbox hook.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, isUnavailable } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useNotificationsContext } from "../providers/NotificationsProvider";
import type {
  NotificationPreferenceView,
  SetNotificationPreferenceInput,
} from "../../shared/types";

export interface NotificationPreferences {
  items: NotificationPreferenceView[];
  isReady: boolean;
  /** The server won't serve this caller: signed out, or preconditions unmet. */
  isUnavailable: boolean;
  isSaving: boolean;
  /** Last save failure, already human-readable. */
  error: string | null;
  setPreference: (input: SetNotificationPreferenceInput) => Promise<void>;
}

export function useNotificationPreferences(): NotificationPreferences {
  const { client, toast } = useNotificationsContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.preferences,
    queryFn: () => client.listPreferences(),
    retry: (failureCount, error) => !isUnavailable(error) && failureCount < 2,
  });

  const save = useMutation({
    mutationFn: (input: SetNotificationPreferenceInput) =>
      client.setPreference(input),
    // The server answers with the whole list, so take it as the new truth
    // instead of refetching what we were just given.
    onSuccess: (items) => queryClient.setQueryData(queryKeys.preferences, items),
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast?.error(error.message);
    },
  });

  const unavailable = isUnavailable(query.error);

  return {
    items: query.data ?? [],
    isReady: !query.isPending || unavailable,
    isUnavailable: unavailable,
    isSaving: save.isPending,
    error: save.error instanceof ApiError ? save.error.message : null,
    setPreference: async (input) => {
      await save.mutateAsync(input).catch(() => undefined);
    },
  };
}
