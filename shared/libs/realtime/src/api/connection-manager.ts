import type { SSEStreamingApi } from "hono/streaming";

export interface ConnectionManager {
  /** Register a new connection (SSE stream) for a user. */
  add(userId: string, stream: SSEStreamingApi): void;
  /** Remove a connection when it closes. */
  remove(userId: string, stream: SSEStreamingApi): void;
  /** Get all active streams for a user. */
  getStreams(userId: string): Set<SSEStreamingApi>;
  /** Check if a user has any active connections. */
  isConnected(userId: string): boolean;
  /**
   * Register a listener fired once a user's LAST stream closes (a true
   * disconnect). Used by the room manager to drop the user from every room.
   */
  onUserDisconnected(listener: (userId: string) => void): void;
}

export function createConnectionManager(): ConnectionManager {
  const connections = new Map<string, Set<SSEStreamingApi>>();
  const disconnectListeners: Array<(userId: string) => void> = [];

  return {
    add(userId, stream) {
      let streams = connections.get(userId);
      if (!streams) {
        streams = new Set();
        connections.set(userId, streams);
      }
      streams.add(stream);
    },

    remove(userId, stream) {
      const streams = connections.get(userId);
      if (!streams) return;
      streams.delete(stream);
      if (streams.size === 0) {
        connections.delete(userId);
        // Last stream gone — the user is fully disconnected.
        for (const listener of disconnectListeners) {
          try {
            listener(userId);
          } catch {
            // A misbehaving listener must not break connection teardown.
          }
        }
      }
    },

    getStreams(userId) {
      return connections.get(userId) ?? new Set();
    },

    isConnected(userId) {
      const streams = connections.get(userId);
      return !!streams && streams.size > 0;
    },

    onUserDisconnected(listener) {
      disconnectListeners.push(listener);
    },
  };
}
