/**
 * Collaboration router factory, mounted by the app under /collaboration. :kind is a kind a slice plugged in (else 404).
 *
 *   POST /:kind/:id/join      opens the document live for this client: { document, head, revision, members, leases }
 *   POST /:kind/:id/watch     hears the document's room without editing it: its locks and who is on it (read, else 404): { members }
 *   POST /:kind/:id/unwatch   stops hearing it
 *   POST /:kind/:id/leave     closes it for this client
 *   POST /:kind/:id/leases    { paths, action, operation? }: acquire, renew or release one editor per path: { granted, heldBy }
 *   POST /:kind/:id/save      any JSON object, handed to the kind as it is: saved now, if anything changed: { head, saved }
 *   POST /:kind/:id/changes   { changes, ifUnchanged? }: this client's changes, pushed to the document's room: { revision, refused, why, heldBy }.
 *                             Refused whole, or with ifUnchanged one by one: only those that still apply to what they were made from
 *
 * Every route needs a signed-in user, who is the actor, and x-client, the browser tab it comes from. The kind's owner
 * says who may read the document (join: else 404) and write it (leases, changes, save: else 403). A locked document takes
 * no lease and no change.
 */
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DocumentParamsSchema, LeaseBodySchema, SaveBodySchema, SendChangesBodySchema } from "../models/collaboration.schemas";
import type { CollaborationService } from "../services/collaboration.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { CollaborationEnv } from "../types";
import { askerOf, requireClient } from "./route-helpers";

export interface CreateCollaborationRouterDeps {
  collaborationService: CollaborationService;
  errors: ModuleErrors;
}

export function createCollaborationRouter({ collaborationService, errors }: CreateCollaborationRouterDeps) {
  const router = new Hono<CollaborationEnv>();

  router.post("/:kind/:id/join", zValidator("param", DocumentParamsSchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    return c.json(await collaborationService.join(kind, id, requireClient(c, errors), askerOf(c)));
  });

  router.post("/:kind/:id/watch", zValidator("param", DocumentParamsSchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    const { members } = await collaborationService.watch(kind, id, requireClient(c, errors).actorId, askerOf(c));
    return c.json({ watching: true, members });
  });

  router.post("/:kind/:id/unwatch", zValidator("param", DocumentParamsSchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    collaborationService.unwatch(kind, id, requireClient(c, errors).actorId);
    return c.json({ watching: false });
  });

  router.post("/:kind/:id/leave", zValidator("param", DocumentParamsSchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    await collaborationService.leave(kind, id, requireClient(c, errors).clientId);
    return c.json({ left: true });
  });

  router.post("/:kind/:id/leases", zValidator("param", DocumentParamsSchema), zValidator("json", LeaseBodySchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    return c.json(await collaborationService.lease(kind, id, requireClient(c, errors).clientId, c.req.valid("json"), askerOf(c)));
  });

  router.post("/:kind/:id/save", zValidator("param", DocumentParamsSchema), zValidator("json", SaveBodySchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    return c.json(await collaborationService.save(kind, id, { actorId: requireClient(c, errors).actorId, details: c.req.valid("json") }, askerOf(c)));
  });

  router.post("/:kind/:id/changes", zValidator("param", DocumentParamsSchema), zValidator("json", SendChangesBodySchema), async (c) => {
    const { kind, id } = c.req.valid("param");
    const { changes, ifUnchanged } = c.req.valid("json");
    const { clientId } = requireClient(c, errors);
    return c.json(ifUnchanged
      ? await collaborationService.receiveChangesIfUnchanged(kind, id, clientId, changes, askerOf(c))
      : await collaborationService.receiveChanges(kind, id, clientId, changes, askerOf(c)));
  });

  return router;
}
