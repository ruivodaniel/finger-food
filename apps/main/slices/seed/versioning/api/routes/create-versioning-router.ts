/**
 * Versioning router factory, mounted by the app under /versioned. :entity is a name in the versioned list (else 404),
 * :entityId the identity.
 *
 *   GET  /:entity/:entityId/history                every version with its label, the branches, the releases
 *   GET  /:entity/:entityId/branches               the branches with their heads
 *   GET  /:entity/:entityId                        the entity as it was: ?branch= (default main), ?at= (default now)
 *   GET  /:entity/:entityId/versions/:versionId    one version and its row
 *   GET  /:entity/:entityId/compare                what changed between ?from= and ?to=
 *   POST /:entity/:entityId/clone                  { from, toBranch?, expectedHead?, intent? }: on the version's own branch, a restore
 *   POST /:entity/:entityId/merge                  { sources, toBranch?, data, expectedHead?, intent? }
 *   POST /:entity/:entityId/branch-hierarchy       { name }: the branch, from main's heads, on it and everything under it
 *   POST /:entity/:entityId/releases               { versionId, title?, description? }: a version of main, numbered
 *   POST /:entity/:entityId/branches/:name/archive
 *
 * Every route needs a signed-in user: the author of a write is always the session's user. The entity's owner says
 * who may read its history (else 404) and who may change it (else 403).
 */
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ArchiveBranchParamsSchema, BranchHierarchyBodySchema, CloneBodySchema, CompareQuerySchema, MergeBodySchema, ReadAtQuerySchema, ReleaseBodySchema, VersionedParamsSchema, VersionParamsSchema } from "../models/versioning.schemas";
import type { VersioningService } from "../services/versioning.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { VersioningEnv } from "../types";
import { askerOf, requireAuthor } from "./route-helpers";

export interface CreateVersioningRouterDeps {
  versioningService: VersioningService;
  errors: ModuleErrors;
}

export function createVersioningRouter({ versioningService, errors }: CreateVersioningRouterDeps): Hono<VersioningEnv> {
  const router = new Hono<VersioningEnv>();

  router.get("/:entity/:entityId/history", zValidator("param", VersionedParamsSchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    return c.json(await versioningService.getHistory(askerOf(c, errors), entity, entityId));
  });

  router.get("/:entity/:entityId/branches", zValidator("param", VersionedParamsSchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    return c.json(await versioningService.getBranches(askerOf(c, errors), entity, entityId));
  });

  router.get("/:entity/:entityId/versions/:versionId", zValidator("param", VersionParamsSchema), async (c) => {
    const { entity, entityId, versionId } = c.req.valid("param");
    return c.json(await versioningService.readVersion(askerOf(c, errors), entity, entityId, versionId));
  });

  router.get("/:entity/:entityId/compare", zValidator("param", VersionedParamsSchema), zValidator("query", CompareQuerySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    const { from, to } = c.req.valid("query");
    return c.json(await versioningService.compare(askerOf(c, errors), entity, entityId, from, to));
  });

  router.get("/:entity/:entityId", zValidator("param", VersionedParamsSchema), zValidator("query", ReadAtQuerySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    return c.json(await versioningService.readAt(askerOf(c, errors), entity, entityId, c.req.valid("query")));
  });

  router.post("/:entity/:entityId/clone", zValidator("param", VersionedParamsSchema), zValidator("json", CloneBodySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    const { from, ...options } = c.req.valid("json");
    return c.json(await versioningService.clone(askerOf(c, errors), entity, entityId, from, requireAuthor(c.get("user"), errors), options), 201);
  });

  router.post("/:entity/:entityId/merge", zValidator("param", VersionedParamsSchema), zValidator("json", MergeBodySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    const { sources, data, ...options } = c.req.valid("json");
    return c.json(await versioningService.merge(askerOf(c, errors), entity, entityId, sources, data, requireAuthor(c.get("user"), errors), options), 201);
  });

  router.post("/:entity/:entityId/branch-hierarchy", zValidator("param", VersionedParamsSchema), zValidator("json", BranchHierarchyBodySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    return c.json(await versioningService.branchHierarchy(askerOf(c, errors), entity, entityId, c.req.valid("json").name, requireAuthor(c.get("user"), errors)), 201);
  });

  router.post("/:entity/:entityId/releases", zValidator("param", VersionedParamsSchema), zValidator("json", ReleaseBodySchema), async (c) => {
    const { entity, entityId } = c.req.valid("param");
    const { versionId, ...details } = c.req.valid("json");
    return c.json(await versioningService.release(askerOf(c, errors), entity, entityId, versionId, requireAuthor(c.get("user"), errors), details), 201);
  });

  router.post("/:entity/:entityId/branches/:name/archive", zValidator("param", ArchiveBranchParamsSchema), async (c) => {
    const { entity, entityId, name } = c.req.valid("param");
    return c.json(await versioningService.archiveBranch(askerOf(c, errors), entity, entityId, name));
  });

  return router;
}
