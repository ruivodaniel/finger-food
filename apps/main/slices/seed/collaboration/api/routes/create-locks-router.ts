/**
 * Locks router, mounted by the collaboration router under /locks. :kind is a kind a slice plugged in (else 404).
 *
 *   GET    /locks                      the page of locks the caller may see: { rows, total }
 *   GET    /locks/:kind?ids=a,b        the locks the caller may see among these documents: a list's marks
 *   GET    /locks/:kind/:documentId    the document's lock, and whether the caller may lock or unlock it
 *   PUT    /locks/:kind/:documentId    locks it: 201, or 409 when it is already locked, 403 when the rules refuse
 *   DELETE /locks/:kind/:documentId    unlocks it: 404 when there is no lock the caller sees, 403 when the rules refuse
 *
 * Every route needs the request's access context: who may lock and unlock is the app's rules.
 */
import { zValidator } from "@hono/zod-validator";
import { PRIVATE } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { LockKindParamsSchema, LockListQuerySchema, LockParamsSchema, LocksOfQuerySchema } from "../models/collaboration.schemas";
import type { DocumentLockService } from "../services/document-lock.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { CollaborationEnv } from "../types";
import { requireScopedAc } from "./route-helpers";

export interface CreateLocksRouterDeps {
  lockService: DocumentLockService;
  errors: ModuleErrors;
}

export function createLocksRouter({ lockService, errors }: CreateLocksRouterDeps) {
  const router = new Hono<CollaborationEnv>();

  router.get("/", zValidator("query", LockListQuerySchema), async (c) => {
    return c.json(await lockService.getAll(requireScopedAc(c, errors), PRIVATE, c.req.valid("query")));
  });

  router.get("/:kind", zValidator("param", LockKindParamsSchema), zValidator("query", LocksOfQuerySchema), async (c) => {
    return c.json(await lockService.getLocksOf(requireScopedAc(c, errors), PRIVATE, c.req.valid("param").kind, c.req.valid("query").ids));
  });

  router.get("/:kind/:documentId", zValidator("param", LockParamsSchema), async (c) => {
    const { kind, documentId } = c.req.valid("param");
    return c.json(await lockService.getState(requireScopedAc(c, errors), PRIVATE, kind, documentId));
  });

  router.put("/:kind/:documentId", zValidator("param", LockParamsSchema), async (c) => {
    const { kind, documentId } = c.req.valid("param");
    const ac = requireScopedAc(c, errors);
    return c.json(await lockService.lock(ac, PRIVATE, kind, documentId, ac.userId), 201);
  });

  router.delete("/:kind/:documentId", zValidator("param", LockParamsSchema), async (c) => {
    const { kind, documentId } = c.req.valid("param");
    await lockService.unlock(requireScopedAc(c, errors), PRIVATE, kind, documentId);
    return c.json({ unlocked: true });
  });

  return router;
}
