/**
 * The http client the app hands over at mount, and where the slice's endpoints hang. Every api file builds on it; nothing
 * else may. Every request says which browser tab it comes from: leases, members and undo are per tab.
 */

/** What the slice needs from the app's http client. */
export interface CollaborationHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

let client: CollaborationHttp | null = null;
let clientPath = "/api/client";
let tabId = "";

export function configureHttp(http: CollaborationHttp, clientId: string, path?: string): void {
  client = http;
  tabId = clientId;
  if (path) clientPath = path;
}

export function http(): CollaborationHttp {
  if (!client) throw new Error("collaboration web is not mounted: call mountCollaborationWeb first");
  const app = client;
  return {
    request: <T>(path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set("x-client", tabId);
      return app.request<T>(path, { ...init, headers });
    },
  };
}

export function clientUrl(rest: string): string {
  return `${clientPath}${rest}`;
}
