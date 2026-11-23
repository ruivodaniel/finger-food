/**
 * The orchestrator's client of the open API, as a worker calls it.
 *
 * Every request carries two tokens: the orchestrator's own (EdDSA with its
 * private key, two minutes), which says the orchestrator is calling, and main's
 * delegation for the message being answered, which says for whom. The
 * orchestrator never names a user itself. Server only: the private key never
 * leaves the runner.
 */

import { sign } from "hono/jwt";

/** Where the open API is and the key that signs the orchestrator's token; the orchestrator's env has this shape. */
export interface OpenApiEnv {
  OPEN_API_URL?: string;
  ORCHESTRATOR_PRIVATE_KEY?: string;
}

const SERVICE_TOKEN_LIFETIME_SECONDS = 120;

/** The orchestrator's token for the open API. */
export async function serviceToken(env: OpenApiEnv): Promise<string> {
  if (!env.ORCHESTRATOR_PRIVATE_KEY) throw new Error("ORCHESTRATOR_PRIVATE_KEY is not set");
  const iat = Math.floor(Date.now() / 1000);
  return sign(
    { iss: "orchestrator", aud: "open-api", sub: "orchestrator", iat, exp: iat + SERVICE_TOKEN_LIFETIME_SECONDS },
    env.ORCHESTRATOR_PRIVATE_KEY,
    "EdDSA",
  );
}

export function openApiUrl(env: OpenApiEnv, path: string): URL {
  if (!env.OPEN_API_URL) throw new Error("OPEN_API_URL is not set");
  return new URL(path, env.OPEN_API_URL);
}

export async function openApiHeaders(env: OpenApiEnv, delegation: string): Promise<Record<string, string>> {
  return { Authorization: `Bearer ${await serviceToken(env)}`, "X-Delegation": delegation };
}

export interface OpenApiRequest {
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

/** One request for the delegated user. Any status is an answer; only a failed connection throws. */
export async function request(
  env: OpenApiEnv,
  delegation: string,
  req: OpenApiRequest,
  timeoutMs: number,
): Promise<{ status: number; body: unknown }> {
  const url = openApiUrl(env, req.path);
  for (const [key, value] of Object.entries(req.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    method: req.method,
    headers: {
      ...(await openApiHeaders(env, delegation)),
      Accept: "application/json",
      ...(req.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: req.body === undefined ? undefined : JSON.stringify(req.body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
