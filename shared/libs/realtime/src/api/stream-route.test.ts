import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createConnectionManager } from "./connection-manager";
import { createStreamRoute } from "./stream-route";

function appWith(options: Parameters<typeof createStreamRoute>[1]) {
  const manager = createConnectionManager();
  const app = new Hono<{ Variables: { user: { id: string } } }>()
    .use("*", async (c, next) => {
      c.set("user", { id: "alice" });
      await next();
    })
    .get("/stream", createStreamRoute(manager, options));
  return { app, manager };
}

describe("createStreamRoute", () => {
  it("closes a connection at its max age and forgets it", async () => {
    const { app, manager } = appWith({ maxAgeMs: 50 });

    const res = await app.request("/stream");
    // the body ends when the server closes the connection
    const text = await res.text();

    expect(text).toContain("event: connected");
    expect(manager.getStreams("alice").size).toBe(0);
  });

  it("keeps a connection open without a max age", async () => {
    const { app, manager } = appWith({});

    const res = await app.request("/stream");
    const reader = res.body!.getReader();
    await reader.read();

    expect(manager.getStreams("alice").size).toBe(1);
    await reader.cancel();
  });
});
