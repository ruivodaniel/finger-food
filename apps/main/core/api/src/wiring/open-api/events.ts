// Main's one realtime connection to the open API's events. Every slice that
// needs the open API's events subscribes to its own channel on this
// connection: never open a second one.
import { sign } from "hono/jwt";
import { createRealtimeClient, type RealtimeClient } from "@libs/realtime/client";
import { Env } from "@/env";

/** The open API closes a connection after 15 minutes; the client replaces it before. */
const OPEN_API_CONNECTION_MAX_AGE_MS = 15 * 60_000;
const TOKEN_LIFETIME_SECONDS = 300;

/**
 * Opens the connection and keeps it open. A fresh token is signed for every
 * connection, with main's private key. After a real drop the events of the gap
 * are not replayed: onReconnect is where each slice catches up.
 */
export function connectToOpenApiEvents(options: { onReconnect: () => void }): RealtimeClient {
  const privateKey = Env.MAIN_PRIVATE_KEY;
  if (!Env.OPEN_API_URL || !privateKey) throw new Error("OPEN_API_URL or MAIN_PRIVATE_KEY is not set");

  return createRealtimeClient({
    baseUrl: Env.OPEN_API_URL,
    streamPath: "/events",
    getHeaders: async () => {
      const iat = Math.floor(Date.now() / 1000);
      const token = await sign(
        { iss: "main", aud: "open-api", iat, exp: iat + TOKEN_LIFETIME_SECONDS },
        privateKey,
        "EdDSA",
      );
      return { Authorization: `Bearer ${token}` };
    },
    maxAgeMs: OPEN_API_CONNECTION_MAX_AGE_MS,
    onReconnect: options.onReconnect,
  });
}
