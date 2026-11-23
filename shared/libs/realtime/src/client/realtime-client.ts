import type { RealtimeConfig, RealtimeEvent } from "../types";

type Subscriber = (event: RealtimeEvent) => void;

export interface RealtimeClientOptions extends RealtimeConfig {
  /** The server's limit on one connection: the client opens a new one before it. */
  maxAgeMs?: number;
  /** Runs once connected again after a drop. Events pushed during the drop are not replayed. */
  onReconnect?: () => void;
  /** Runs on every connection: the first one, and each one after a drop. Not on a replacement before maxAgeMs, which
   * loses nothing. */
  onConnected?: () => void;
  /** Whether the stream carries cookies: "include" for a browser whose session is a cookie of another origin. */
  credentials?: RequestCredentials;
}

export interface RealtimeClient {
  /** Calls back on every event of a channel until unsubscribed. */
  subscribe(channel: string, callback: Subscriber): () => void;
  /** Closes the connection for good. */
  close(): void;
  readonly connected: boolean;
}

/** How long before maxAgeMs the replacement connection is opened. */
const REPLACE_BEFORE_MS = 30_000;
const MAX_RETRY_DELAY_MS = 30_000;

/**
 * Holds one realtime connection to another server, in plain TypeScript (no
 * React, no browser), and hands each event to the subscribers of its channel.
 *
 * EventSource cannot send headers, so the stream is read with fetch, which
 * carries the headers getHeaders returns. getHeaders runs before every
 * connection, so a short-lived token is fresh each time.
 *
 * Before maxAgeMs a new connection is opened, and the old one is closed only
 * once the new one is connected: no event falls in a gap, and the overlap's
 * duplicates are for the subscriber to drop. After a drop it reconnects,
 * waiting 1 s, doubling up to 30 s, and then runs onReconnect.
 */
export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  const url = `${options.baseUrl}${options.streamPath ?? "/api/realtime/stream"}`;
  const subscribers = new Map<string, Set<Subscriber>>();

  /** The connection events come from; null while not connected. */
  let current: AbortController | null = null;
  /** A connection opened but not yet connected: the first one, a replacement or a retry. */
  let pending: AbortController | null = null;
  let dropped = false;
  let wasEverConnected = false;
  let closed = false;
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let replaceTimer: ReturnType<typeof setTimeout> | undefined;

  function connect(): void {
    const controller = new AbortController();
    pending = controller;
    let wasConnected = false;

    const onConnected = () => {
      wasConnected = true;
      current?.abort(); // the connection this one replaces
      current = controller;
      pending = null;
      retryCount = 0;
      scheduleReplacement();
      const replacing = wasEverConnected && !dropped;
      wasEverConnected = true;
      if (dropped) {
        dropped = false;
        options.onReconnect?.();
      }
      if (!replacing) options.onConnected?.();
    };

    read(controller.signal, onConnected)
      .catch(() => {
        // An error ends the connection the same way the server closing it does.
      })
      .finally(() => {
        if (closed || controller.signal.aborted) return; // closed or replaced by us

        if (controller === current) {
          // The connection dropped. If a replacement is already on its way, it takes over.
          current = null;
          dropped = true;
          clearTimeout(replaceTimer);
          if (!pending) retry();
        } else if (!wasConnected) {
          // This attempt never connected; the current connection, if any, keeps delivering.
          pending = null;
          retry();
        }
      });
  }

  function retry(): void {
    const delay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_DELAY_MS);
    retryCount += 1;
    retryTimer = setTimeout(connect, delay);
  }

  function scheduleReplacement(): void {
    clearTimeout(replaceTimer);
    if (options.maxAgeMs === undefined) return;
    // Half the limit when it is too short to keep the full margin.
    const delay = Math.max(options.maxAgeMs - REPLACE_BEFORE_MS, options.maxAgeMs / 2);
    replaceTimer = setTimeout(connect, delay);
  }

  async function read(signal: AbortSignal, onConnected: () => void): Promise<void> {
    const headers = await options.getHeaders?.();
    const res = await fetch(url, {
      headers: { Accept: "text/event-stream", ...headers },
      credentials: options.credentials,
      signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`[realtime] stream answered ${res.status}`);
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;

      // SSE frames end with a blank line; the last piece may be an unfinished frame.
      buffer += value;
      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const { event, data } = parseFrame(frame);
        if (event === "connected") onConnected();
        else if (event === "message") deliver(data);
        // heartbeat and anything else: nothing to do
      }
    }
  }

  function deliver(data: string): void {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(data);
    } catch {
      return; // a bad frame is skipped, the connection goes on
    }
    for (const callback of subscribers.get(event.channel) ?? []) {
      try {
        callback(event);
      } catch {
        // A misbehaving subscriber must not break the connection.
      }
    }
  }

  connect();

  return {
    subscribe(channel, callback) {
      let channelSubs = subscribers.get(channel);
      if (!channelSubs) {
        channelSubs = new Set();
        subscribers.set(channel, channelSubs);
      }
      channelSubs.add(callback);

      return () => {
        channelSubs.delete(callback);
        if (channelSubs.size === 0) subscribers.delete(channel);
      };
    },

    close() {
      closed = true;
      clearTimeout(retryTimer);
      clearTimeout(replaceTimer);
      current?.abort();
      pending?.abort();
      current = null;
      pending = null;
    },

    get connected() {
      return current !== null;
    },
  };
}

/** One SSE frame's event name and data; the event is "message" when the frame names none. */
function parseFrame(frame: string): { event: string; data: string } {
  let event = "message";
  const data: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
  }
  return { event, data: data.join("\n") };
}
