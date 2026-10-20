// Hono app: CORS, requestId, /health, /api/auth, /api/client/*, /api/m2m,
// global error handler.
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { Env } from "@/env";
import { userOrg } from "@/mounts";
import { clientRouter } from "@/routes/client";
import { m2mRouter } from "@/routes/m2m";
import { BaseAppError, extractRequestContext } from "@/shared/error";
import { logger } from "@/shared/logger";
import type { HonoContext } from "@/shared/context";

export const app = new Hono<HonoContext>();

app.use("*", requestId());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return undefined;
      if (Env.ALLOWED_ORIGINS.includes(origin)) return origin;
      if (Env.CORS_ORIGIN_PATTERN?.test(origin)) return origin;
      return undefined;
    },
    credentials: true,
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth-provider HTTP surface — path + router owned by the mount; resolves its
// own sessions. Rate limiters attach on authMount.rateLimitPaths when they land.
app.route(userOrg.authMount.basePath, userOrg.authMount.router);

// /api/client — client-facing surface (MOD12): session → gate → module router.
app.route("/api/client", clientRouter);

// /api/m2m — server-to-server surface (MOD12): service JWT → routers.
app.route("/api/m2m", m2mRouter);

app.onError((err, c) => {
  const ctx = extractRequestContext(c);

  if (err instanceof BaseAppError) {
    logger.warn({ err, ...ctx }, err.message);
    return c.json(
      { error: err.message, requestId: ctx.requestId },
      err.statusCode,
    );
  }

  if (err instanceof HTTPException) {
    logger.warn({ err, ...ctx }, err.message);
    return c.json({ error: err.message, requestId: ctx.requestId }, err.status);
  }

  logger.error({ err, ...ctx }, "Unhandled error");
  return c.json(
    { error: "Internal Server Error", requestId: ctx.requestId },
    500,
  );
});
