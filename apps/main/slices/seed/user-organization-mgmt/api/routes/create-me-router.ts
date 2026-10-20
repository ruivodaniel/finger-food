/**
 * Me router factory — the authenticated caller's own account. The caller is
 * ALWAYS resolved from the session (context vars) — no user id is ever read
 * from the request.
 *
 * Routes:
 *   GET    /me                        user + profile + identifiers
 *   PATCH  /me/profile                update profile fields
 *   POST   /me/profile/avatar-upload  presign the caller's avatar upload
 *   GET    /me/preferences            effective preferences (choices over defaults)
 *   PATCH  /me/preferences            change some fields → the new effective view
 *   POST   /me/identifiers            add a login identifier (starts verification)
 *   POST   /me/identifiers/verify     prove the delivered code
 *   DELETE /me/identifiers            remove a login identifier
 */

import { PRIVATE } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import type { UserService } from "../services/user.service";
import type { UserPreferencesService } from "../services/user-preferences.service";
import type { ModuleErrors } from "../shared/module-errors";
import { UpdateProfileSchema } from "../models/user.schemas";
import { UpdateUserPreferencesSchema } from "../models/user-preferences.schemas";
import { requireScopedAc, requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

const IdentifierBodySchema = z.object({
  type: z.enum(["email", "phone"]),
  value: z.string().min(1),
});

export interface CreateMeRouterOptions {
  userService: UserService;
  userPreferencesService: UserPreferencesService;
  errors: ModuleErrors;
}

export function createMeRouter(options: CreateMeRouterOptions) {
  const { userService, userPreferencesService, errors } = options;
  const router = new Hono<UserOrgMgmtEnv>();

  router.get("/me", async (c) => {
    const user = requireUser(c, errors);
    return c.json(await userService.getMe(PRIVATE, user.id));
  });

  router.get("/me/preferences", async (c) => {
    const user = requireUser(c, errors);
    const ac = requireScopedAc(c, errors);
    return c.json(await userPreferencesService.getOwn(ac, user.id));
  });

  router.patch(
    "/me/preferences",
    zValidator("json", UpdateUserPreferencesSchema),
    async (c) => {
      const user = requireUser(c, errors);
      const ac = requireScopedAc(c, errors);
      return c.json(
        await userPreferencesService.updateOwn(ac, user.id, c.req.valid("json")),
      );
    },
  );

  router.patch(
    "/me/profile",
    zValidator("json", UpdateProfileSchema),
    async (c) => {
      const user = requireUser(c, errors);
      const ac = requireScopedAc(c, errors);
      await userService.updateOwnProfile(
        ac,
        PRIVATE,
        user.id,
        c.req.valid("json"),
      );
      return c.json(await userService.getMe(PRIVATE, user.id));
    },
  );

  router.post(
    "/me/profile/avatar-upload",
    zValidator("json", z.object({ contentType: z.string().min(1) })),
    async (c) => {
      const user = requireUser(c, errors);
      return c.json(
        await userService.presignAvatarUpload(
          PRIVATE,
          user.id,
          c.req.valid("json").contentType,
        ),
      );
    },
  );

  router.post(
    "/me/identifiers",
    zValidator("json", IdentifierBodySchema),
    async (c) => {
      const user = requireUser(c, errors);
      const result = await userService.addIdentifier(
        PRIVATE,
        user.id,
        c.req.valid("json"),
      );
      return c.json(result, 201);
    },
  );

  router.post(
    "/me/identifiers/verify",
    zValidator(
      "json",
      IdentifierBodySchema.extend({
        flowId: z.string().min(1),
        code: z.string().min(1),
      }),
    ),
    async (c) => {
      const user = requireUser(c, errors);
      await userService.verifyIdentifier(PRIVATE, user.id, c.req.valid("json"));
      return c.json(await userService.getMe(PRIVATE, user.id));
    },
  );

  router.delete(
    "/me/identifiers",
    zValidator("json", IdentifierBodySchema),
    async (c) => {
      const user = requireUser(c, errors);
      await userService.removeIdentifier(PRIVATE, user.id, c.req.valid("json"));
      return c.json(await userService.getMe(PRIVATE, user.id));
    },
  );

  return router;
}
