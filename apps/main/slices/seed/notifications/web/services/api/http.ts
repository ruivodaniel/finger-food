/**
 * The http client the app hands over at mount, and where the module's
 * endpoints hang. Every api file builds on it; nothing else may.
 */

/** What the module needs from the app's http client. */
export interface NotificationsHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

let client: NotificationsHttp | null = null;
let clientPath = "/api/client";

export function configureHttp(http: NotificationsHttp, path?: string): void {
  client = http;
  if (path) clientPath = path;
}

export function http(): NotificationsHttp {
  if (!client) throw new Error("notifications web is not mounted: call mountNotificationsWeb first");
  return client;
}

export function clientUrl(rest: string): string {
  return `${clientPath}${rest}`;
}
