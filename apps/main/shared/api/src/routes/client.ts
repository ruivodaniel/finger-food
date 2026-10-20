// composes /api/client from mounts + features. Middleware order per API21:
// session → scoped-AC hydration (roles/permissions bag) → gate → routers.
import { Hono } from "hono";
import type { HonoContext } from "@/shared/context";
import { notifications, userOrg } from "@/mounts";

export const clientRouter = new Hono<HonoContext>()
  .use("*", userOrg.sessionMiddleware)
  .use("*", userOrg.scopedAcMiddleware)
  .use("*", userOrg.gateMiddleware)
  .route("/", userOrg.router)
  // Inbox and preferences read the caller from the same session context.
  .route("/", notifications.router);
