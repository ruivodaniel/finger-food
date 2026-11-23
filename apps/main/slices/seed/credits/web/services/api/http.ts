/**
 * The http client the app hands over at mount, and where the slice's endpoints
 * hang. Every api file builds on it; nothing else may.
 */

/** What the slice needs from the app's http client. */
export interface CreditsHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

let client: CreditsHttp | null = null;
let clientPath = "/api/client";
let organizationHeader = "x-active-organization";

export function configureHttp(http: CreditsHttp, path?: string, header?: string): void {
  client = http;
  if (path) clientPath = path;
  if (header) organizationHeader = header;
}

export function http(): CreditsHttp {
  if (!client) throw new Error("credits web is not mounted: call mountCreditsWeb first");
  return client;
}

export function clientUrl(rest: string): string {
  return `${clientPath}${rest}`;
}

/** Names the organization a request acts in, when it is not simply the active one. */
export function inOrganization(organizationId: string | undefined, init: RequestInit = {}): RequestInit {
  if (!organizationId) return init;
  // the content type is the app's client's to set: named here too, the browser joins the two and the API reads no body
  return { ...init, headers: { [organizationHeader]: organizationId } };
}
