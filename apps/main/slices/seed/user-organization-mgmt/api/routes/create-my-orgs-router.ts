/**
 * My-organizations router factory — the caller's own membership surface,
 * plus the public invitation-accept view (a capability URL, no auth).
 *
 * Routes:
 *   GET  /me/memberships                    MembershipView[] (org + my roles)
 *   GET  /me/creatable-organization-types   org types the caller may found
 *   GET  /me/invitations                    pending, matched to my identifiers
 *   POST /me/invitations/:id/accept         { consents? }
 *   POST /me/invitations/:id/reject
 *   GET  /invitations/:id                   PUBLIC — InvitationPublicView
 */

import { PRIVATE, PUBLIC } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import type { OrganizationService } from "../services/organization.service";
import type { MembershipService } from "../services/membership.service";
import type { InvitationService } from "../services/invitation.service";
import { LegalConsentTypeSchema } from "../models/legal.schemas";
import type { ModuleErrors } from "../shared/module-errors";
import { requestMeta, requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateMyOrgsRouterOptions {
  organizationService: OrganizationService;
  membershipService: MembershipService;
  invitationService: InvitationService;
  errors: ModuleErrors;
}

export function createMyOrgsRouter(options: CreateMyOrgsRouterOptions) {
  const { organizationService, membershipService, invitationService, errors } =
    options;
  const router = new Hono<UserOrgMgmtEnv>();

  router.get("/me/memberships", async (c) => {
    const user = requireUser(c, errors);
    return c.json(
      await membershipService.getAllMembershipsByUserId(PRIVATE, user.id),
    );
  });

  router.get("/me/creatable-organization-types", async (c) => {
    requireUser(c, errors);
    return c.json(organizationService.creatableTypes(PRIVATE));
  });

  router.get("/me/invitations", async (c) => {
    const user = requireUser(c, errors);
    return c.json(
      await invitationService.getInvitationsByUserId(PRIVATE, user.id),
    );
  });

  router.post(
    "/me/invitations/:id/accept",
    zValidator(
      "json",
      z.object({
        consents: z
          .array(
            z.object({ type: LegalConsentTypeSchema, accepted: z.boolean() }),
          )
          .optional(),
      }),
    ),
    async (c) => {
      const user = requireUser(c, errors);
      await invitationService.accept(
        PRIVATE,
        user.id,
        c.req.param("id"),
        c.req.valid("json").consents,
        requestMeta(c),
      );
      return c.json({ ok: true });
    },
  );

  router.post("/me/invitations/:id/reject", async (c) => {
    const user = requireUser(c, errors);
    await invitationService.reject(PRIVATE, user.id, c.req.param("id"));
    return c.json({ ok: true });
  });

  // AC42: PUBLIC — no requireUser/requireScopedAc; a capability URL, reachable
  // pre-session (AC22). This is the one endpoint on this router that is NOT
  // private, contrary to a router-level simplification — classified per
  // endpoint, per the doc's rule 1.
  router.get("/invitations/:id", async (c) => {
    return c.json(
      await invitationService.getPublicView(PUBLIC, c.req.param("id")),
    );
  });

  return router;
}
