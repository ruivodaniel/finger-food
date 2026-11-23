import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ConnectionManager } from "./connection-manager";

interface StreamRouteOptions {
  /** Heartbeat interval in milliseconds (default: 30_000) */
  heartbeatMs?: number;
  /**
   * Closes a connection this long after it opened (default: never). The
   * credentials are checked only when a connection opens, so this is how often
   * they are checked again: the client reconnects with fresh ones.
   */
  maxAgeMs?: number;
}

export function createStreamRoute(manager: ConnectionManager, options?: StreamRouteOptions) {
  const heartbeatMs = options?.heartbeatMs ?? 30_000;
  const maxAgeMs = options?.maxAgeMs;
  return (c: Context) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return streamSSE(c, async (stream) => {
      manager.add(user.id, stream);

      // Send initial connection event
      await stream.writeSSE({
        event: "connected",
        data: JSON.stringify({ userId: user.id }),
      });

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(async () => {
        try {
          await stream.writeSSE({ event: "heartbeat", data: "" });
        } catch {
          clearInterval(heartbeat);
        }
      }, heartbeatMs);

      // Wait until the client disconnects
      stream.onAbort(() => {
        clearInterval(heartbeat);
        manager.remove(user.id, stream);
      });

      // Block the handler from returning (keeps the stream open), until the
      // client disconnects or the connection reaches its max age
      let maxAge: ReturnType<typeof setTimeout> | undefined;
      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
        if (maxAgeMs) maxAge = setTimeout(resolve, maxAgeMs);
      });
      clearTimeout(maxAge);
      clearInterval(heartbeat);
      manager.remove(user.id, stream);
    });
  };
}
