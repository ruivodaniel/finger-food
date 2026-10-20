import type { ConnectionManager } from "./connection-manager";
import type { PushOptions, RealtimeEvent } from "../types";

export function createPush(
  manager: ConnectionManager,
): (userId: string, options: PushOptions) => Promise<void> {
  return async (userId, options) => {
    const streams = manager.getStreams(userId);
    if (streams.size === 0) return;

    const event: RealtimeEvent = {
      channel: options.channel,
      event: options.event,
      data: options.data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const promises: Promise<void>[] = [];
    for (const stream of streams) {
      promises.push(
        stream.writeSSE({
          event: "message",
          data: JSON.stringify(event),
          id: event.id,
        }),
      );
    }

    await Promise.allSettled(promises);
  };
}
