import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { RealtimeConfig, RealtimeEvent } from "../types";

type Subscriber = (event: RealtimeEvent) => void;

interface RealtimeContextValue {
  subscribe: (channel: string, callback: Subscriber) => () => void;
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

interface RealtimeProviderProps {
  config: RealtimeConfig;
  enabled: boolean;
  children: React.ReactNode;
}

export function RealtimeProvider({
  config,
  enabled,
  children,
}: RealtimeProviderProps) {
  const [connected, setConnected] = useState(false);
  const [reconnectTick, setReconnectTick] = useState(0);
  const subscribersRef = useRef(new Map<string, Set<Subscriber>>());
  const retryCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subscribe = useCallback(
    (channel: string, callback: Subscriber): (() => void) => {
      const subs = subscribersRef.current;
      let channelSubs = subs.get(channel);
      if (!channelSubs) {
        channelSubs = new Set();
        subs.set(channel, channelSubs);
      }
      channelSubs.add(callback);

      return () => {
        channelSubs.delete(callback);
        if (channelSubs.size === 0) {
          subs.delete(channel);
        }
      };
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    const streamPath = config.streamPath ?? "/api/realtime/stream";
    const url = `${config.baseUrl}${streamPath}`;

    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("connected", () => {
      setConnected(true);
    });

    eventSource.addEventListener("message", (e) => {
      try {
        const event: RealtimeEvent = JSON.parse(e.data);
        const channelSubs = subscribersRef.current.get(event.channel);
        if (channelSubs) {
          for (const callback of channelSubs) {
            callback(event);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[realtime] Failed to parse event:', e.data, err);
        }
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      setConnected(false);
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
      retryCountRef.current += 1;
      reconnectTimerRef.current = setTimeout(() => {
        setReconnectTick((t) => t + 1);
      }, delay);
    };

    eventSource.onopen = () => {
      retryCountRef.current = 0;
      setConnected(true);
    };

    return () => {
      eventSource.close();
      setConnected(false);
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [enabled, config.baseUrl, config.streamPath, reconnectTick]);

  return (
    <RealtimeContext.Provider value={{ subscribe, connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error("useRealtimeContext must be used within a RealtimeProvider");
  }
  return ctx;
}
