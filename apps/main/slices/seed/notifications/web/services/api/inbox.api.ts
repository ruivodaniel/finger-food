import type { NotificationInboxPage } from "../../../shared/types";
import { clientUrl, http } from "./http";

const post = (path: string) =>
  http()
    .request<unknown>(clientUrl(path), { method: "POST", body: JSON.stringify({}) })
    .then(() => undefined);

export const inboxApi = {
  list(query?: { limit?: number; cursor?: string }): Promise<NotificationInboxPage> {
    const params = new URLSearchParams();
    if (query?.limit !== undefined) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return http().request(clientUrl(`/notifications${qs ? `?${qs}` : ""}`));
  },
  markSeen: (deliveryId: string) => post(`/notifications/${encodeURIComponent(deliveryId)}/seen`),
  dismiss: (deliveryId: string) => post(`/notifications/${encodeURIComponent(deliveryId)}/dismiss`),
};
