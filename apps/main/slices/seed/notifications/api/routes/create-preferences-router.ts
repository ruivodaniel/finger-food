/**
 * Preferences router factory — the caller's own notification switches.
 *
 * Routes:
 *   GET /notification-preferences   every type × channel, pinned ones marked
 *   PUT /notification-preferences   set one (type, channel) switch
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { SetPreferenceSchema } from "../models/notification.schemas";
import type { PreferenceService } from "../services/preference.service";
import type { ModuleErrors } from "../shared/module-errors";
import { requireUserId } from "./route-helpers";
import type { NotificationsEnv } from "../types";

export interface CreatePreferencesRouterOptions {
  preferenceService: PreferenceService;
  errors: ModuleErrors;
}

export function createPreferencesRouter(
  options: CreatePreferencesRouterOptions,
) {
  const { preferenceService, errors } = options;
  const router = new Hono<NotificationsEnv>();

  router.get("/notification-preferences", async (c) => {
    const userId = requireUserId(c, errors);
    return c.json({ items: await preferenceService.list(userId) });
  });

  router.put(
    "/notification-preferences",
    zValidator("json", SetPreferenceSchema),
    async (c) => {
      const userId = requireUserId(c, errors);
      const items = await preferenceService.set(userId, c.req.valid("json"));
      return c.json({ items });
    },
  );

  return router;
}
