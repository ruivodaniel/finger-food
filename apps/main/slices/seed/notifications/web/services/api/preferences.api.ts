import type { NotificationPreferenceView, SetNotificationPreferenceInput } from "../../../shared/types";
import { clientUrl, http } from "./http";

export const preferencesApi = {
  list: () =>
    http()
      .request<{ items: NotificationPreferenceView[] }>(clientUrl("/notification-preferences"))
      .then((body) => body.items),
  set: (input: SetNotificationPreferenceInput) =>
    http()
      .request<{ items: NotificationPreferenceView[] }>(clientUrl("/notification-preferences"), {
        method: "PUT",
        body: JSON.stringify(input),
      })
      .then((body) => body.items),
};
