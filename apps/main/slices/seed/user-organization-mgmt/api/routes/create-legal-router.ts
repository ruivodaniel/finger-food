/**
 * Legal router factory — the consent surface and the authoring surface.
 *
 * `/legal/*` sits inside the gate's exclude prefix: it IS the resolve
 * surface, reachable while 428-blocked. `/legal-admin/*` deliberately is
 * NOT — authoring is a privileged domain action and a blocked author
 * resolves at /resolve first; publishing is exactly what re-gates everyone
 * else.
 *
 * Routes:
 *   GET  /legal/documents/current?type=&orgTypeId=   latest published (404 if none)
 *   GET  /legal/documents/:id                        one published version (drafts 404)
 *   GET  /legal/consent/pending                      unmet consent, grouped by scope
 *   GET  /legal/consent/history                      the caller's own consent records
 *   POST /legal/consent                              record consent (context "gate")
 *   GET  /legal-admin/catalog                        authorable (scope, type) pairs
 *   GET  /legal-admin/documents?type=&orgTypeId=     every version, drafts included
 *   GET  /legal-admin/documents/:id                  one version, draft visible
 *   PUT  /legal-admin/documents/draft                upsert the scope's draft
 *   POST /legal-admin/documents/:id/publish          publish a draft
 */

import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import type { LegalDocumentService } from "../services/legal-document.service";
import type { ConsentRecordService } from "../services/consent-record.service";
import type { GateService } from "../services/gate.service";
import {
  LegalConsentTypeSchema,
  SaveLegalDocumentDraftSchema,
} from "../models/legal.schemas";
import type { ModuleErrors } from "../shared/module-errors";
import { requestMeta, requireScopedAc, requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateLegalRouterOptions {
  legalDocumentService: LegalDocumentService;
  consentRecordService: Pick<
    ConsentRecordService,
    "recordConsentScoped" | "listForUser"
  >;
  gateService: Pick<GateService, "pendingConsents">;
  errors: ModuleErrors;
}

export function createLegalRouter(options: CreateLegalRouterOptions) {
  const router = new Hono<UserOrgMgmtEnv>();

  router.get(
    "/legal/documents/current",
    zValidator(
      "query",
      z.object({
        type: LegalConsentTypeSchema,
        orgTypeId: z.string().min(1).optional(),
      }),
    ),
    async (c) => {
      const { type, orgTypeId } = c.req.valid("query");
      const doc = await options.legalDocumentService.getLatestVersion(
        PUBLIC,
        type,
        orgTypeId ?? null,
      );
      if (!doc) throw options.errors.notFound("no published document");
      return c.json(doc);
    },
  );

  router.get("/legal/documents/:id", async (c) => {
    const doc = await options.legalDocumentService.getDocumentById(
      PUBLIC,
      c.req.param("id"),
    );
    return c.json(doc);
  });

  router.get("/legal/consent/pending", async (c) => {
    const user = requireUser(c, options.errors);
    const snapshot = c.get("sessionSnapshot");
    if (!snapshot) throw options.errors.unauthorized("no session");
    const pending = await options.gateService.pendingConsents(PRIVATE, {
      userId: user.id,
      identityId: user.identityId,
      session: snapshot,
      memberships: c.get("session")?.memberships ?? [],
    });
    return c.json(pending);
  });

  router.get("/legal/consent/history", async (c) => {
    const user = requireUser(c, options.errors);
    const records = await options.consentRecordService.listForUser(user.id);
    return c.json(
      records.map((r) => ({
        id: r.id,
        type: r.legalDocumentType,
        version: r.legalDocumentVersion,
        legalDocumentId: r.legalDocumentId,
        orgTypeId: r.orgTypeId,
        context: r.context,
        consentedAt: r.consentedAt.toISOString(),
      })),
    );
  });

  router.post(
    "/legal/consent",
    zValidator(
      "json",
      z.object({
        orgTypeId: z.string().min(1).nullable().default(null),
        decisions: z
          .array(
            z.object({ type: LegalConsentTypeSchema, accepted: z.boolean() }),
          )
          .min(1),
      }),
    ),
    async (c) => {
      const ac = requireScopedAc(c, options.errors);
      const body = c.req.valid("json");
      await options.consentRecordService.recordConsentScoped(ac, PRIVATE, {
        userId: ac.bag.session.user.id,
        // every accepted decision is recorded; nothing is mandatory at this
        // surface — the gate re-evaluates what's still owed
        items: body.decisions.map((d) => ({
          type: d.type,
          shown: true,
          consent: true,
          mandatory: false,
        })),
        decisions: body.decisions,
        orgTypeId: body.orgTypeId,
        context: "gate",
        ...requestMeta(c),
      });
      return c.json({ ok: true });
    },
  );

  // ── Authoring (/legal-admin — gate-visible, gated by the engine) ──

  router.get("/legal-admin/catalog", async (c) => {
    const ac = requireScopedAc(c, options.errors);
    return c.json(options.legalDocumentService.authoringCatalog(ac, PRIVATE));
  });

  router.get(
    "/legal-admin/documents",
    zValidator(
      "query",
      z.object({
        type: LegalConsentTypeSchema,
        orgTypeId: z.string().min(1).optional(),
      }),
    ),
    async (c) => {
      const ac = requireScopedAc(c, options.errors);
      const { type, orgTypeId } = c.req.valid("query");
      return c.json(
        await options.legalDocumentService.getVersions(
          ac,
          PRIVATE,
          type,
          orgTypeId ?? null,
        ),
      );
    },
  );

  router.put(
    "/legal-admin/documents/draft",
    zValidator("json", SaveLegalDocumentDraftSchema),
    async (c) => {
      const ac = requireScopedAc(c, options.errors);
      return c.json(
        await options.legalDocumentService.saveDraft(
          ac,
          PRIVATE,
          c.req.valid("json"),
        ),
      );
    },
  );

  router.get("/legal-admin/documents/:id", async (c) => {
    const ac = requireScopedAc(c, options.errors);
    const doc = await options.legalDocumentService.getDocumentByIdForAuthor(
      ac,
      PRIVATE,
      c.req.param("id"),
    );
    return c.json(doc);
  });

  router.post("/legal-admin/documents/:id/publish", async (c) => {
    const ac = requireScopedAc(c, options.errors);
    return c.json(
      await options.legalDocumentService.publishDraft(
        ac,
        PRIVATE,
        c.req.param("id"),
      ),
    );
  });

  return router;
}
