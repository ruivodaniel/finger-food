// The m2m gate: a service JWT from the orchestrator, HS256 with the shared
// secret, iss/aud fixing the direction, a short lifetime.
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { describe, expect, it } from "vitest";
import { createServiceJwtMiddleware } from "@/middlewares/service-jwt";

const SECRET = "test-secret-at-least-16-chars";

function app(secret: string | undefined) {
  return new Hono()
    .use("*", createServiceJwtMiddleware({ secret, issuer: "orchestrator", audience: "main", maxLifetime: 300 }))
    .post("/reconcile", (c) => c.json({ ok: true }));
}

async function token(claims: Record<string, unknown> = {}, secret = SECRET): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  return sign({ iss: "orchestrator", aud: "main", sub: "orchestrator", iat, exp: iat + 60, ...claims }, secret, "HS256");
}

const post = (a: Hono, t?: string) => a.request("/reconcile", { method: "POST", headers: t ? { authorization: `Bearer ${t}` } : {} });

describe("service jwt middleware", () => {
  it("lets a valid token through", async () => {
    expect((await post(app(SECRET), await token())).status).toBe(200);
  });

  it("refuses no token, a wrong secret, issuer, audience, an expired or over-long token", async () => {
    expect((await post(app(SECRET))).status).toBe(401);
    for (const t of [
      await token({}, "another-secret-of-16-chars"),
      await token({ iss: "main" }),
      await token({ aud: "orchestrator" }),
      await token({ exp: Math.floor(Date.now() / 1000) - 10 }),
      await token({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    ]) {
      expect((await post(app(SECRET), t)).status, t).toBe(401);
    }
  });

  it("answers 503 when no secret is configured", async () => {
    expect((await post(app(undefined), await token())).status).toBe(503);
  });
});
