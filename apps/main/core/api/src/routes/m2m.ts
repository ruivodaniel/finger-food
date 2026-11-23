// composes /api/m2m — server-to-server routes (MOD12): service JWT → routers.
import { Hono } from "hono";
import { Env } from "@/env";
import { createServiceJwtMiddleware } from "@/middlewares/service-jwt";
import type { HonoContext } from "@/shared/context";
import { workflowIntentsM2mRouter } from "@/routes/m2m/workflow-intents.router";

export const m2mRouter = new Hono<HonoContext>()
  .use("*", createServiceJwtMiddleware({ secret: Env.SERVICE_JWT_SECRET, issuer: "orchestrator", audience: "main", maxLifetime: 300 }))
  .route("/", workflowIntentsM2mRouter);
