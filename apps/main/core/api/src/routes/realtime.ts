// /api/realtime — the signed-in user's realtime stream (SSE): one per browser
// tab, every feature's events on their own channels.
import { Hono } from "hono";
import { createStreamRoute } from "@libs/realtime/api";
import type { HonoContext } from "@/shared/context";
import { realtimeConnections, userOrg } from "@/mounts";

export const realtimeRouter = new Hono<HonoContext>()
  .use("*", userOrg.sessionMiddleware)
  .get("/stream", createStreamRoute(realtimeConnections));
