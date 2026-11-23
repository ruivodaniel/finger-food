// Starts chat runs on the orchestrator, each with the delegation it needs to
// reach the open API as the user the message is from.
import { sign } from "hono/jwt";
import type { StartRun } from "@modules/chatbot/api";
import { Env } from "@/env";

/** The run's longest duration (900 s) plus a minute. */
const DELEGATION_LIFETIME_SECONDS = 960;
const SERVICE_TOKEN_LIFETIME_SECONDS = 60;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

/**
 * The only proof of whom the orchestrator may act for: one user message, of
 * one chat, of one user. EdDSA with main's private key, so only main can
 * issue it, and the open API checks it with main's public key.
 */
export function signDelegation(input: {
  userId: string;
  organizationId: string | null;
  chatId: string;
  messageId: string;
}): Promise<string> {
  if (!Env.MAIN_PRIVATE_KEY) throw new Error("MAIN_PRIVATE_KEY is not set");
  const iat = nowInSeconds();
  return sign(
    { ...input, iss: "main", aud: "open-api", typ: "delegation", iat, exp: iat + DELEGATION_LIFETIME_SECONDS },
    Env.MAIN_PRIVATE_KEY,
    "EdDSA",
  );
}

/**
 * Starts the chat pipeline for one user message. The token is the one the
 * orchestrator's existing gate checks: HS256 with the shared secret, role main.
 * Any answer but 202 with a run id is a failure.
 */
export const startRun: StartRun = async ({ chatId, messageId, prompt, history, bag }) => {
  if (!Env.ORCHESTRATOR_URL || !Env.SERVICE_JWT_SECRET) {
    throw new Error("ORCHESTRATOR_URL or SERVICE_JWT_SECRET is not set");
  }

  const delegation = await signDelegation({
    userId: bag.userId,
    organizationId: bag.activeOrganizationId,
    chatId,
    messageId,
  });
  const iat = nowInSeconds();
  const token = await sign(
    { iss: "main", aud: "orchestrator", sub: "main", role: "main", iat, exp: iat + SERVICE_TOKEN_LIFETIME_SECONDS },
    Env.SERVICE_JWT_SECRET,
    "HS256",
  );

  // The chat pipeline's one input slot, `request`, takes the run's data inline.
  const request = { type: "type-structured-content", value: { chatId, messageId, prompt, history, bag, delegation } };
  const res = await fetch(`${Env.ORCHESTRATOR_URL}/pipelines/chat/runs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: { request } }),
  });
  const body = (await res.json().catch(() => null)) as { run?: unknown } | null;
  if (res.status !== 202 || typeof body?.run !== "string") {
    throw new Error(`the orchestrator answered ${res.status} to the chat run`);
  }
  return { runId: body.run };
};
