/**
 * Meteor router factory.
 *
 * Public (PUBLIC token, no access context):
 *   GET    /meteors                           published meteors, paged
 *   GET    /meteors/:meteorId                 one published meteor
 * The active organization's (PRIVATE token, requireScopedAc):
 *   GET    /organization/meteors              the company's, paged, drafts included
 *   GET    /organization/meteors/:meteorId    detail
 *   POST   /organization/meteors              create (201), a draft
 *   PATCH  /organization/meteors/:meteorId    update; publish is { status: "published" }
 *   DELETE /organization/meteors/:meteorId    delete
 */

import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreateMeteorSchema, MeteorListQuerySchema, UpdateMeteorSchema } from "../models/meteor.schemas";
import type { MeteorService } from "../services/meteor.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { ImplementationPatternsEnv } from "../types";
import { requireScopedAc } from "./route-helpers";

export interface CreateMeteorRouterDeps {
  meteorService: MeteorService;
  errors: ModuleErrors;
}

export function createMeteorRouter({ meteorService, errors }: CreateMeteorRouterDeps): Hono<ImplementationPatternsEnv> {
  const router = new Hono<ImplementationPatternsEnv>();

  router.get("/meteors", zValidator("query", MeteorListQuerySchema), async (c) => {
    return c.json(await meteorService.getPublished(PUBLIC, c.req.valid("query")));
  });

  router.get("/meteors/:meteorId", async (c) => {
    return c.json(await meteorService.getPublishedById(PUBLIC, c.req.param("meteorId")));
  });

  router.get("/organization/meteors", zValidator("query", MeteorListQuerySchema), async (c) => {
    const ac = requireScopedAc(c, errors);
    return c.json(await meteorService.getAll(ac, PRIVATE, c.req.valid("query")));
  });

  router.get("/organization/meteors/:meteorId", async (c) => {
    const ac = requireScopedAc(c, errors);
    return c.json(await meteorService.getById(ac, PRIVATE, c.req.param("meteorId")));
  });

  router.post("/organization/meteors", zValidator("json", CreateMeteorSchema), async (c) => {
    const ac = requireScopedAc(c, errors);
    return c.json(await meteorService.create(ac, PRIVATE, c.req.valid("json")), 201);
  });

  router.patch("/organization/meteors/:meteorId", zValidator("json", UpdateMeteorSchema), async (c) => {
    const ac = requireScopedAc(c, errors);
    return c.json(await meteorService.update(ac, PRIVATE, c.req.param("meteorId"), c.req.valid("json")));
  });

  router.delete("/organization/meteors/:meteorId", async (c) => {
    const ac = requireScopedAc(c, errors);
    await meteorService.remove(ac, PRIVATE, c.req.param("meteorId"));
    return c.json({ ok: true });
  });

  return router;
}
