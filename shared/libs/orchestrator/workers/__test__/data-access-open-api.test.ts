// The open API client a worker calls (its two tokens and a request) and the
// data-access-open-api worker, with fetch stubbed.
import { generateKeyPairSync } from "node:crypto";
import { verify } from "hono/jwt";
import { afterEach, describe, expect, it, vi } from "vitest";
import { request } from "../lib/open-api";
import { makeCtx } from "./harness";

const keys = generateKeyPairSync("ed25519");
const publicKey = keys.publicKey.export({ type: "spki", format: "pem" }).toString();
const env = { OPEN_API_URL: "http://open-api.test", ORCHESTRATOR_PRIVATE_KEY: keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString() };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request", () => {
  it("sends the orchestrator's token and main's delegation, and returns any status", async () => {
    const fetch = vi.fn(async () => Response.json({ error: "not found" }, { status: 404 }));
    vi.stubGlobal("fetch", fetch);

    const res = await request(env, "the-delegation", { method: "GET", path: "/organizations", query: { search: "Acme", page: undefined } }, 1000);

    expect(res).toEqual({ status: 404, body: { error: "not found" } });
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("http://open-api.test/organizations?search=Acme");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Delegation"]).toBe("the-delegation");
    const token = await verify(headers.Authorization!.slice("Bearer ".length), publicKey, "EdDSA");
    expect(token).toMatchObject({ iss: "orchestrator", aud: "open-api", sub: "orchestrator" });
    expect(Number(token.exp) - Number(token.iat)).toBe(120);
  });

  it("refuses to run without the open API's settings", async () => {
    await expect(request({ ...env, OPEN_API_URL: undefined }, "d", { method: "GET", path: "/x" }, 1000)).rejects.toThrow("OPEN_API_URL");
    await expect(request({ ...env, ORCHESTRATOR_PRIVATE_KEY: undefined }, "d", { method: "GET", path: "/x" }, 1000)).rejects.toThrow("ORCHESTRATOR_PRIVATE_KEY");
  });
});

describe("data-access-open-api", () => {
  it("makes every request and returns each response, a refused one included", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: URL) => (url.pathname === "/me/organizations" ? Response.json({ rows: [] }) : Response.json({ error: "no" }, { status: 403 }))));
    const { run } = await import("../data-access-open-api/v1/worker");
    const { ctx } = await makeCtx({ openApiUrl: env.OPEN_API_URL, privateKey: env.ORCHESTRATOR_PRIVATE_KEY });

    const out = await run(
      {
        request: {
          type: "type-structured-content",
          value: {
            delegation: "d",
            requests: [
              { id: "mine", method: "GET", path: "/me/organizations" },
              { id: "other", method: "GET", path: "/organizations/x" },
            ],
          },
        },
      },
      { timeoutMs: 1000 },
      ctx,
    );

    expect("value" in out.result && out.result.value.responses).toEqual([
      { id: "mine", status: 200, body: { rows: [] } },
      { id: "other", status: 403, body: { error: "no" } },
    ]);
  });
});
