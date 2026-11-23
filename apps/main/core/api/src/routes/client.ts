// composes /api/client from mounts + features. Middleware order per API21:
// session → scoped-AC hydration (roles/permissions bag) → gate → routers.
import { Hono } from "hono";
import type { HonoContext } from "@/shared/context";
import { chatbot, collaboration, credits, implementationPatterns, notifications, payment, userOrg, versioning } from "@/mounts";

export const clientRouter = new Hono<HonoContext>()
  .use("*", userOrg.sessionMiddleware)
  .use("*", userOrg.scopedAcMiddleware)
  .use("*", userOrg.gateMiddleware)
  .route("/", userOrg.router)
  // Inbox and preferences read the caller from the same session context.
  .route("/", notifications.router)
  // Credits and caps, and billing, prove access through the same scoped-AC context.
  .route("/", credits.router)
  .route("/", payment.router)
  // The user's chats; a run's bag comes from the session and the scoped-AC context.
  .route("/", chatbot.router)
  // The implementation patterns: the company's meteors read the same access context; the public ones and the
  // minesweeper need none.
  .route("/", implementationPatterns.router)
  // History of any versioned entity, and documents edited live: both read the caller from the session.
  .route("/versioned", versioning.router)
  .route("/collaboration", collaboration.router);
