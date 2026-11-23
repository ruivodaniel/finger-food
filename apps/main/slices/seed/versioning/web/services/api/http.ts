/**
 * The http client the app hands over at mount, and where the slice's endpoints hang. Every api file builds on it; nothing
 * else may.
 */

/** What the slice needs from the app's http client. */
export interface VersioningHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

let client: VersioningHttp | null = null;
let clientPath = "/api/client";

export function configureHttp(http: VersioningHttp, path?: string): void {
  client = http;
  if (path) clientPath = path;
}

export function http(): VersioningHttp {
  if (!client) throw new Error("versioning web is not mounted: call mountVersioningWeb first");
  return client;
}

export function clientUrl(rest: string): string {
  return `${clientPath}${rest}`;
}
