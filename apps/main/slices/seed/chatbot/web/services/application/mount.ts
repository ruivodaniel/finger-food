/**
 * What the app hands the slice at mount: its http client and where the
 * slice's endpoints hang, its query client (so commands update what they
 * changed), its router, how the chat page reads the active organization's
 * name (the app owns the active organization), where dictation's speech
 * model is served from, and the app's one real-time connection.
 */

import type { QueryClient } from "@tanstack/react-query";
import type { RealtimeEvent } from "@libs/realtime";
import { configureHttp, type ChatbotHttp } from "../api/http";
import { listenToChats } from "./chats.service";

export type { ChatbotHttp } from "../api/http";

/** What the slice needs from the app's real-time connection: the chats service subscribes on it, nothing else does. */
export interface ChatbotRealtime {
  subscribe(channel: string, callback: (event: RealtimeEvent) => void): () => void;
  /** Runs on every connection: the first one, and each one after a drop. Events of a gap are not replayed. */
  onConnected(callback: () => void): () => void;
}

export interface RouterAdapter {
  navigate: (options: { to: string; replace?: boolean }) => void | Promise<void>;
}

export interface MountChatbotWebOptions {
  http: ChatbotHttp;
  /** Domain surface base path — matches where the app mounts the router (default /api/client). */
  clientPath?: string;
  queryClient: QueryClient;
  /** The app's one real-time connection: each chat's events arrive on it. */
  realtime: ChatbotRealtime;
  router?: RouterAdapter;
  /** A hook: the active organization's name, for the new chat's text; null without one. */
  useActiveOrganizationName?: () => string | null;
  /**
   * Dictation in the composer, transcribed in the browser (English). Where the
   * speech model and ONNX Runtime are served from; absent = no dictation.
   */
  dictation?: { modelBaseUrl: string };
}

type Adapters = Omit<MountChatbotWebOptions, "http" | "clientPath">;

let adapters: Adapters | null = null;

/** Wire the slice's services to the app. Call once, before the first render. */
export function mountChatbotWeb({ http, clientPath, ...rest }: MountChatbotWebOptions): void {
  configureHttp(http, clientPath);
  adapters = rest;
  listenToChats(rest.realtime);
}

export function mounted(): Adapters {
  if (!adapters) throw new Error("chatbot web is not mounted: call mountChatbotWeb first");
  return adapters;
}
