import { useEffect, useState } from "react";
import type { RealtimeEvent } from "../types";
import { useRealtimeContext } from "./RealtimeProvider";

interface UseRealtimeChannelResult<T = unknown> {
  /** The most recent event on this channel (null if none received yet) */
  lastEvent: RealtimeEvent<T> | null;
  /** Whether the SSE connection is currently open */
  connected: boolean;
}

export function useRealtimeChannel<T = unknown>(
  channel: string,
): UseRealtimeChannelResult<T> {
  const { subscribe, connected } = useRealtimeContext();
  const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(channel, (event) => {
      setLastEvent(event as RealtimeEvent<T>);
    });
    return unsubscribe;
  }, [channel, subscribe]);

  return { lastEvent, connected };
}
