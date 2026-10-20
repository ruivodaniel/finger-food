import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ConnectionManager } from "./connection-manager";

interface StreamRouteOptions {
  /** Heartbeat interval in milliseconds (default: 30_000) */
  heartbeatMs?: number;
}

export function createStreamRoute(manager: ConnectionManager, options?: StreamRouteOptions) {
  const heartbeatMs = options?.heartbeatMs ?? 30_000;
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

      // Block the handler from returning (keeps the stream open)
      await new Promise<void>((resolve) => {
        stream.onAbort(() => resolve());
      });
    });
  };
}
