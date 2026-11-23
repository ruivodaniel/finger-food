/**
 * The app's one real-time connection, open while a user is signed in. The core builds it once and hands it to each slice
 * at mount; a slice's application service subscribes to the channels it needs. No component or hook subscribes.
 *
 * What slices get stays the same object for the whole page: signing in opens the stream underneath, signing out closes it,
 * and another user signing in opens a new one. Subscriptions carry over from one stream to the next.
 */

import type { RealtimeEvent } from "@libs/realtime";
import { createRealtimeClient, type RealtimeClient } from "@libs/realtime/client";

export interface AppRealtime {
  /** Calls back on every event of a channel until unsubscribed. */
  subscribe(channel: string, callback: (event: RealtimeEvent) => void): () => void;
  /** Runs on every connection: the first one, and each one after a drop or a new sign-in. Events of a gap are not replayed. */
  onConnected(callback: () => void): () => void;
  readonly connected: boolean;
}

interface Subscription {
  channel: string;
  callback: (event: RealtimeEvent) => void;
  off?: () => void;
}

export function createAppRealtime(baseUrl: string) {
  let client: RealtimeClient | null = null;
  const subscriptions = new Set<Subscription>();
  const connectedListeners = new Set<() => void>();

  const realtime: AppRealtime = {
    subscribe(channel, callback) {
      const subscription: Subscription = { channel, callback, off: client?.subscribe(channel, callback) };
      subscriptions.add(subscription);
      return () => {
        subscription.off?.();
        subscriptions.delete(subscription);
      };
    },
    onConnected(callback) {
      connectedListeners.add(callback);
      return () => connectedListeners.delete(callback);
    },
    get connected() {
      return client?.connected ?? false;
    },
  };

  function open(): void {
    if (client) return;
    client = createRealtimeClient({
      baseUrl,
      // the session is a cookie of the API's origin
      credentials: "include",
      onConnected: () => connectedListeners.forEach((run) => run()),
    });
    for (const subscription of subscriptions) subscription.off = client.subscribe(subscription.channel, subscription.callback);
  }

  function close(): void {
    client?.close();
    client = null;
    for (const subscription of subscriptions) subscription.off = undefined;
  }

  return { realtime, open, close };
}
