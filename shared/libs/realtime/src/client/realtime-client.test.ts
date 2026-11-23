import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRealtimeClient } from "./realtime-client";

/** One stream the fake server opened: the test writes SSE text into it, or ends it. */
interface FakeConnection {
  headers: Record<string, string>;
  signal: AbortSignal;
  write(text: string): void;
  end(): void;
}

let connections: FakeConnection[];

/** Lets the client's fetch, reads and promise chains run. Timers stay fake. */
const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((resolve) => setImmediate(resolve));
};

const message = (channel: string, data: unknown) =>
  `event: message\ndata: ${JSON.stringify({ channel, event: "update", data, timestamp: "t" })}\n\n`;
const connected = "event: connected\ndata: {}\n\n";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  connections = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const encoder = new TextEncoder();
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const body = new ReadableStream<Uint8Array>({ start: (c) => { controller = c; } });
      const signal = init.signal!;
      signal.addEventListener("abort", () => controller.error(new DOMException("Aborted", "AbortError")));
      connections.push({
        headers: init.headers as Record<string, string>,
        signal,
        write: (text) => controller.enqueue(encoder.encode(text)),
        end: () => controller.close(),
      });
      return new Response(body, { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createRealtimeClient", () => {
  it("hands a message only to the subscribers of its channel", async () => {
    const client = createRealtimeClient({ baseUrl: "http://open-api", streamPath: "/events" });
    const chat = vi.fn();
    const other = vi.fn();
    client.subscribe("chat", chat);
    client.subscribe("other", other);
    await flush();

    connections[0].write(connected + message("chat", { seq: 1 }));
    await flush();

    expect(client.connected).toBe(true);
    expect(chat).toHaveBeenCalledWith(expect.objectContaining({ channel: "chat", data: { seq: 1 } }));
    expect(other).not.toHaveBeenCalled();
    client.close();
  });

  it("stops calling back once unsubscribed", async () => {
    const client = createRealtimeClient({ baseUrl: "http://open-api" });
    const chat = vi.fn();
    const unsubscribe = client.subscribe("chat", chat);
    await flush();
    connections[0].write(connected);

    unsubscribe();
    connections[0].write(message("chat", {}));
    await flush();

    expect(chat).not.toHaveBeenCalled();
    client.close();
  });

  it("reads a frame split across two chunks", async () => {
    const client = createRealtimeClient({ baseUrl: "http://open-api" });
    const chat = vi.fn();
    client.subscribe("chat", chat);
    await flush();

    const frame = message("chat", { seq: 7 });
    connections[0].write(connected + frame.slice(0, 20));
    await flush();
    expect(chat).not.toHaveBeenCalled();

    connections[0].write(frame.slice(20));
    await flush();
    expect(chat).toHaveBeenCalledTimes(1);
    client.close();
  });

  it("skips a frame that is not JSON and keeps going", async () => {
    const client = createRealtimeClient({ baseUrl: "http://open-api" });
    const chat = vi.fn();
    client.subscribe("chat", chat);
    await flush();

    connections[0].write(connected + "event: message\ndata: not json\n\n" + message("chat", {}));
    await flush();

    expect(chat).toHaveBeenCalledTimes(1);
    expect(client.connected).toBe(true);
    client.close();
  });

  it("asks for fresh headers on every connection", async () => {
    let token = 0;
    const getHeaders = vi.fn(() => ({ Authorization: `Bearer ${++token}` }));
    const client = createRealtimeClient({ baseUrl: "http://open-api", getHeaders });
    await flush();
    connections[0].write(connected);
    connections[0].end();
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    await flush();

    expect(getHeaders).toHaveBeenCalledTimes(2);
    expect(connections[0].headers.Authorization).toBe("Bearer 1");
    expect(connections[1].headers.Authorization).toBe("Bearer 2");
    client.close();
  });

  it("replaces the connection before maxAgeMs, closing the old one only once the new one is connected", async () => {
    const onReconnect = vi.fn();
    const client = createRealtimeClient({ baseUrl: "http://open-api", maxAgeMs: 15 * 60_000, onReconnect });
    const chat = vi.fn();
    client.subscribe("chat", chat);
    await flush();
    connections[0].write(connected);
    await flush();

    await vi.advanceTimersByTimeAsync(15 * 60_000 - 30_000);
    await flush();
    expect(connections).toHaveLength(2);
    expect(connections[0].signal.aborted).toBe(false);

    // the old connection still delivers while the new one is not connected
    connections[0].write(message("chat", { seq: 1 }));
    await flush();
    expect(chat).toHaveBeenCalledTimes(1);

    connections[1].write(connected);
    await flush();
    expect(connections[0].signal.aborted).toBe(true);
    expect(client.connected).toBe(true);
    expect(onReconnect).not.toHaveBeenCalled();
    client.close();
  });

  it("reconnects after a drop, waiting 1 s, doubling up to 30 s, then runs onReconnect", async () => {
    const onReconnect = vi.fn();
    const client = createRealtimeClient({ baseUrl: "http://open-api", onReconnect });
    await flush();
    connections[0].write(connected);
    connections[0].end();
    await flush();
    expect(client.connected).toBe(false);

    // each attempt fails before it connects: 1 s, 2 s, 4 s, 8 s, 16 s, then 30 s
    for (const [i, delay] of [1000, 2000, 4000, 8000, 16_000, 30_000].entries()) {
      await vi.advanceTimersByTimeAsync(delay - 1);
      await flush();
      expect(connections).toHaveLength(i + 1);
      await vi.advanceTimersByTimeAsync(1);
      await flush();
      expect(connections).toHaveLength(i + 2);
      if (delay < 30_000) connections[i + 1].end();
      await flush();
    }

    expect(onReconnect).not.toHaveBeenCalled();
    connections[6].write(connected);
    await flush();
    expect(client.connected).toBe(true);
    expect(onReconnect).toHaveBeenCalledTimes(1);
    client.close();
  });

  it("retries when the server refuses the connection", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("no", { status: 401 }));
    const client = createRealtimeClient({ baseUrl: "http://open-api" });
    await flush();
    expect(connections).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1000);
    await flush();
    expect(connections).toHaveLength(1);
    client.close();
  });

  it("runs onConnected on the first connection and after a drop, never on a replacement", async () => {
    const onConnected = vi.fn();
    const client = createRealtimeClient({ baseUrl: "http://open-api", maxAgeMs: 15 * 60_000, onConnected });
    await flush();
    connections[0].write(connected);
    await flush();
    expect(onConnected).toHaveBeenCalledTimes(1);

    // the replacement before maxAgeMs loses nothing: no call
    await vi.advanceTimersByTimeAsync(15 * 60_000 - 30_000);
    await flush();
    connections[1].write(connected);
    await flush();
    expect(onConnected).toHaveBeenCalledTimes(1);

    // a drop loses events: called again once connected
    connections[1].end();
    await flush();
    await vi.advanceTimersByTimeAsync(1000);
    await flush();
    connections[2].write(connected);
    await flush();
    expect(onConnected).toHaveBeenCalledTimes(2);
    client.close();
  });

  it("sends cookies when asked to", async () => {
    const client = createRealtimeClient({ baseUrl: "http://api", credentials: "include" });
    await flush();
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(init.credentials).toBe("include");
    client.close();
  });

  it("closes for good", async () => {
    const client = createRealtimeClient({ baseUrl: "http://open-api", maxAgeMs: 60_000 });
    await flush();
    connections[0].write(connected);
    await flush();

    client.close();
    await flush();
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    await flush();

    expect(connections[0].signal.aborted).toBe(true);
    expect(connections).toHaveLength(1);
    expect(client.connected).toBe(false);
  });
});
