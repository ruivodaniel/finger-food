/**
 * A realtime event pushed from server to client.
 * This is the transport-agnostic contract — modules never know
 * whether events travel via SSE, WebSocket, or something else.
 */
export interface RealtimeEvent<T = unknown> {
  /** Channel the event belongs to (e.g., "notifications", "conversations") */
  channel: string;
  /** Event name within the channel (e.g., "new", "updated", "deleted") */
  event: string;
  /** Event payload — module-specific data */
  data: T;
  /** Server-assigned timestamp (ISO string) */
  timestamp: string;
  /** Optional event ID for deduplication / resumption */
  id?: string;
}

/**
 * Options for pushing an event from server-side code.
 * Any module with access to the push function uses this shape.
 */
export interface PushOptions {
  channel: string;
  event: string;
  data: unknown;
}

/**
 * Configuration for connecting to the realtime stream (client-side).
 */
export interface RealtimeConfig {
  /** Base URL of the API (e.g., "http://localhost:3000") */
  baseUrl: string;
  /** Path to the SSE endpoint (default: "/api/realtime/stream") */
  streamPath?: string;
  /** Auth headers or cookie-based — depends on app auth strategy */
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
}
