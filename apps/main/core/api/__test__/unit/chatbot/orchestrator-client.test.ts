// Starting a chat run: the request the orchestrator receives, its service
// token, and the delegation main signs for the open API.
import { generateKeyPairSync } from "node:crypto";
import { verify } from "hono/jwt";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const SECRET = "test-secret-at-least-16-chars";
const keys = generateKeyPairSync("ed25519");
const publicKey = keys.publicKey.export({ type: "spki", format: "pem" }).toString();

let startRun: typeof import("@/wiring/chatbot/orchestrator-client").startRun;

beforeAll(async () => {
  // Env is read once, when the module loads.
  process.env.ORCHESTRATOR_URL = "http://orchestrator.test";
  process.env.SERVICE_JWT_SECRET = SECRET;
  process.env.MAIN_PRIVATE_KEY = keys.privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n");
  vi.resetModules();
  ({ startRun } = await import("@/wiring/chatbot/orchestrator-client"));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const run = {
  chatId: "chat-1",
  messageId: "msg-1",
  prompt: "Who are the members of Acme?",
  history: [{ role: "user" as const, content: "hi" }],
  bag: { userId: "alice", activeOrganizationId: "org-1", roles: ["member"] },
};

describe("startRun", () => {
  it("starts the chat pipeline with the run's input and returns the run id", async () => {
    const fetch = vi.fn(async () => Response.json({ run: "run-1" }, { status: 202 }));
    vi.stubGlobal("fetch", fetch);

    expect(await startRun(run)).toEqual({ runId: "run-1" });

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://orchestrator.test/pipelines/chat/runs");
    const { request } = JSON.parse(String(init.body)).input;
    expect(request.type).toBe("type-structured-content");
    const input = request.value;
    expect(input).toMatchObject({ chatId: "chat-1", messageId: "msg-1", prompt: run.prompt, history: run.history, bag: run.bag });

    const token = String((init.headers as Record<string, string>).Authorization).slice("Bearer ".length);
    expect(await verify(token, SECRET, "HS256")).toMatchObject({ iss: "main", aud: "orchestrator", sub: "main", role: "main" });

    const delegation = await verify(input.delegation, publicKey, "EdDSA");
    expect(delegation).toMatchObject({
      iss: "main",
      aud: "open-api",
      typ: "delegation",
      userId: "alice",
      organizationId: "org-1",
      chatId: "chat-1",
      messageId: "msg-1",
    });
    expect(Number(delegation.exp) - Number(delegation.iat)).toBe(960);
  });

  it("fails on any answer but 202 with a run id", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "no pipeline chat" }, { status: 404 })));
    await expect(startRun(run)).rejects.toThrow("404");

    vi.stubGlobal("fetch", vi.fn(async () => Response.json({}, { status: 202 })));
    await expect(startRun(run)).rejects.toThrow("202");
  });
});
