// What the app hands the slice at mount: the http client, the query client, the app's one real-time connection and who
// this tab is. The slice's one wiring point. Names come from the server, with the members.
import type { QueryClient } from "@tanstack/react-query";
import type { RealtimeEvent } from "@libs/realtime";
import { configureHttp, type CollaborationHttp } from "../api/http";
import { listenToConnection } from "./rooms";

export type { CollaborationHttp } from "../api/http";

/** What the slice needs from the app's real-time connection: the service subscribes to rooms on it, nothing else does. */
export interface CollaborationRealtime {
  subscribe(channel: string, callback: (event: RealtimeEvent) => void): () => void;
  /** Runs on every connection: the first one, and each one after a drop. Events of a gap are not replayed. */
  onConnected(callback: () => void): () => void;
  readonly connected: boolean;
}

export interface MountCollaborationWebOptions {
  http: CollaborationHttp;
  /** Where the app mounts the slice's router (default /api/client). */
  clientPath?: string;
  /** The app's query client: the service refreshes what an event changed. */
  queryClient: QueryClient;
  /** The app's one real-time connection. */
  realtime: CollaborationRealtime;
  /** This browser tab's client id: what is mine among the leases. */
  clientId: string;
  /** Moves to a path of the app: the locks page's paging, which lives in the URL. */
  navigate?: (to: string) => void;
}

type Mounted = Omit<MountCollaborationWebOptions, "http" | "clientPath">;

let mounted: Mounted | null = null;

/** Wires the slice's services to the app. Call once, before the first render. */
export function mountCollaborationWeb({ http, clientPath, ...rest }: MountCollaborationWebOptions): void {
  configureHttp(http, rest.clientId, clientPath);
  mounted = rest;
  listenToConnection(rest.realtime);
}

export function mountedApp(): Mounted {
  if (!mounted) throw new Error("collaboration web is not mounted: call mountCollaborationWeb first");
  return mounted;
}
