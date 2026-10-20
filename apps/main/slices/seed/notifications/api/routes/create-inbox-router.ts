/**
 * Inbox router factory — the caller's own in-app notifications.
 *
 * Routes:
 *   GET  /notifications                       cursor page + unseen count
 *   POST /notifications/:deliveryId/seen      mark read
 *   POST /notifications/:deliveryId/dismiss   clear from the inbox
 *
 * Every row is scoped to the session's user by the service, so there is no
 * id-in-the-request to authorize.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { ListInboxQuerySchema } from "../models/notification.schemas";
import type { InboxService } from "../services/inbox.service";
import type { ModuleErrors } from "../shared/module-errors";
import { requireUserId } from "./route-helpers";
import type { NotificationsEnv } from "../types";

export interface CreateInboxRouterOptions {
  inboxService: InboxService;
  errors: ModuleErrors;
}

export function createInboxRouter(options: CreateInboxRouterOptions) {
  const { inboxService, errors } = options;
  const router = new Hono<NotificationsEnv>();

  router.get("/notifications", zValidator("query", ListInboxQuerySchema), async (c) => {
    const userId = requireUserId(c, errors);
    return c.json(await inboxService.list(userId, c.req.valid("query")));
  });

  router.post("/notifications/:deliveryId/seen", async (c) => {
    const userId = requireUserId(c, errors);
    await inboxService.markSeen(userId, c.req.param("deliveryId"));
    return c.json({ status: "ok" });
  });

  router.post("/notifications/:deliveryId/dismiss", async (c) => {
    const userId = requireUserId(c, errors);
    await inboxService.dismiss(userId, c.req.param("deliveryId"));
    return c.json({ status: "ok" });
  });

  return router;
}
