/**
 * Module API client — typed fetch wrappers for the module's own endpoints.
 *
 * It lives in the module on purpose: an app that reaches these routes with a
 * raw fetch is a coupling nobody can see, and removing the module would leave
 * it dangling. Going through this client means removal breaks the consumer at
 * compile time.
 *
 * Cookie sessions, so credentials always ride along. A 401 is a normal answer
 * here — signed out is a state the bell renders as nothing, not an error.
 */

import type {
  NotificationInboxPage,
  NotificationPreferenceView,
  SetNotificationPreferenceInput,
} from "../../shared/types";
import type { NotificationsWebConfig } from "../types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * True when the server declined to serve this caller rather than failing:
 * 401 (no session) or 428 (the app has preconditions this caller hasn't met).
 *
 * Both mean the same thing to a notification surface — there is nothing to
 * show, and asking again won't help until something outside this module
 * changes. The module doesn't interpret WHY; whoever owns those preconditions
 * owns the screen that clears them.
 */
export function isUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.status === 401 || error.status === 428)
  );
}

export interface NotificationsApiClient {
  listInbox(query?: {
    limit?: number;
    cursor?: string;
  }): Promise<NotificationInboxPage>;
  markSeen(deliveryId: string): Promise<void>;
  dismiss(deliveryId: string): Promise<void>;
  listPreferences(): Promise<NotificationPreferenceView[]>;
  setPreference(
    input: SetNotificationPreferenceInput,
  ): Promise<NotificationPreferenceView[]>;
}

function messageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>).error;
  return typeof value === "string" ? value : null;
}

export function createApiClient(
  config: NotificationsWebConfig,
): NotificationsApiClient {
  const base = `${config.apiBaseUrl}${config.clientPath ?? "/api/client"}`;

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : {},
      ...init,
    });
    const text = await response.text();
    const body = text ? safeJson(text) : undefined;
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.status >= 500
          ? "Something went wrong — please try again."
          : (messageOf(body) ?? "Something went wrong — please try again."),
        body,
      );
    }
    return body as T;
  }

  const post = (url: string, body?: unknown) =>
    request<unknown>(url, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    }).then(() => undefined);

  return {
    listInbox: (query) => {
      const params = new URLSearchParams();
      if (query?.limit !== undefined) params.set("limit", String(query.limit));
      if (query?.cursor) params.set("cursor", query.cursor);
      const qs = params.toString();
      return request(`${base}/notifications${qs ? `?${qs}` : ""}`);
    },
    markSeen: (deliveryId) =>
      post(`${base}/notifications/${encodeURIComponent(deliveryId)}/seen`),
    dismiss: (deliveryId) =>
      post(`${base}/notifications/${encodeURIComponent(deliveryId)}/dismiss`),
    listPreferences: () =>
      request<{ items: NotificationPreferenceView[] }>(
        `${base}/notification-preferences`,
      ).then((body) => body.items),
    setPreference: (input) =>
      request<{ items: NotificationPreferenceView[] }>(
        `${base}/notification-preferences`,
        { method: "PUT", body: JSON.stringify(input) },
      ).then((body) => body.items),
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
