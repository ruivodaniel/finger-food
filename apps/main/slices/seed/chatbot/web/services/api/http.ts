/**
 * The http client the app hands over at mount, and where the slice's endpoints
 * hang. Every api file builds on it; nothing else may.
 */

/** What the slice needs from the app's http client. */
export interface ChatbotHttp {
  /** `path` is absolute from the API origin; rejects with an error carrying `status`. */
  request<T>(path: string, init?: RequestInit): Promise<T>;
}

let client: ChatbotHttp | null = null;
let clientPath = "/api/client";

export function configureHttp(http: ChatbotHttp, path?: string): void {
  client = http;
  if (path) clientPath = path;
}

export function http(): ChatbotHttp {
  if (!client) throw new Error("chatbot web is not mounted: call mountChatbotWeb first");
  return client;
}

export function clientUrl(rest: string): string {
  return `${clientPath}${rest}`;
}
