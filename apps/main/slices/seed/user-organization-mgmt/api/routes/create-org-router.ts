/**
 * Organization router factory — creating orgs, and managing ONE TARGETED ORG.
 * Target and context are separate inputs: the TARGET is the `:orgId` in the
 * URL — always a real id, the API has no "current" — and the CONTEXT is the
 * caller's active org, the validated echo of the x-active-organization header
 * that the scoped-AC bag is built from. Access control resolves the target
 * against that context, so a caller whose active-org roles grant cross-org
 * reads (a system admin) can target an org they are not a member of, and a
 * caller without such a grant gets a 404 or an empty list. There is no
 * server-side "switch org" endpoint — the active org is a client-store
 * concern. Org-lifecycle config gates WHAT each org type allows; the
 * access-control engine gates WHO.
 *
 * Routes:
 *   POST   /organizations                                 create (201)
 *   GET    /organizations                                 directory: every org, paged
 *   GET    /organizations/:orgId                          detail
 *   PATCH  /organizations/:orgId                          update name/logo/metadata
 *   POST   /organizations/:orgId/logo-upload              presign the org's logo upload
 *   GET    /organizations/:orgId/members                  { rows: MemberView[], total }
 *   PATCH  /organizations/:orgId/members/:userId          { roles }
 *   DELETE /organizations/:orgId/members/:userId          remove (last owner protected)
 *   POST   /organizations/:orgId/invitations              invite (201) + deliver
 *   GET    /organizations/:orgId/invitations              InvitationView[]
 *   POST   /organizations/:orgId/invitations/:iid/revoke
 */

import { PRIVATE } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import type { OrganizationService } from "../services/organization.service";
import type { MembershipService } from "../services/membership.service";
import type { InvitationService } from "../services/invitation.service";
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from "../models/organization.schemas";
import {
  CreateInvitationSchema,
  UpdateMemberRolesSchema,
} from "../models/invitation.schemas";
import { LegalConsentTypeSchema } from "../models/legal.schemas";
import type { ModuleErrors } from "../shared/module-errors";
import { requestMeta, requireScopedAc, requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateOrgRouterOptions {
  organizationService: OrganizationService;
  membershipService: MembershipService;
  invitationService: InvitationService;
  errors: ModuleErrors;
}

const CreateOrganizationBodySchema = CreateOrganizationSchema.extend({
  consents: z
    .array(z.object({ type: LegalConsentTypeSchema, accepted: z.boolean() }))
    .optional(),
});

export function createOrgRouter(options: CreateOrgRouterOptions) {
  const { organizationService, membershipService, invitationService, errors } =
    options;
  const router = new Hono<UserOrgMgmtEnv>();

  router.post(
    "/organizations",
    zValidator("json", CreateOrganizationBodySchema),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const body = c.req.valid("json");
      const org = await organizationService.create(
        ac,
        PRIVATE,
        body,
        requestMeta(c),
      );
      return c.json(org, 201);
    },
  );

  router.get("/organizations/types", (c) => {
    requireUser(c, errors);
    return c.json(organizationService.organizationTypes(PRIVATE));
  });

  router.get(
    "/organizations",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      }),
    ),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      return c.json(
        await organizationService.getAll(ac, PRIVATE, c.req.valid("query")),
      );
    },
  );

  router.get("/organizations/:orgId", async (c) => {
    const ac = requireScopedAc(c, errors);
    const orgId = c.req.param("orgId");
    return c.json(await organizationService.getById(ac, PRIVATE, orgId));
  });

  router.patch(
    "/organizations/:orgId",
    zValidator("json", UpdateOrganizationSchema),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      return c.json(
        await organizationService.update(
          ac,
          PRIVATE,
          orgId,
          c.req.valid("json"),
        ),
      );
    },
  );

  router.post(
    "/organizations/:orgId/logo-upload",
    zValidator("json", z.object({ contentType: z.string().min(1) })),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      return c.json(
        await organizationService.presignLogoUpload(
          ac,
          PRIVATE,
          orgId,
          c.req.valid("json").contentType,
        ),
      );
    },
  );

  router.get(
    "/organizations/:orgId/members",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
      }),
    ),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      return c.json(
        await membershipService.getAllByOrgIds(
          ac,
          PRIVATE,
          orgId,
          c.req.valid("query"),
        ),
      );
    },
  );

  router.patch(
    "/organizations/:orgId/members/:userId",
    zValidator("json", UpdateMemberRolesSchema),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      await membershipService.updateRoles(
        ac,
        PRIVATE,
        orgId,
        c.req.param("userId"),
        c.req.valid("json").roles,
      );
      return c.json({ ok: true });
    },
  );

  router.delete("/organizations/:orgId/members/:userId", async (c) => {
    const ac = requireScopedAc(c, errors);
    const orgId = c.req.param("orgId");
    await membershipService.remove(ac, PRIVATE, orgId, c.req.param("userId"));
    return c.json({ ok: true });
  });

  router.post(
    "/organizations/:orgId/invitations",
    zValidator("json", CreateInvitationSchema),
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      const invitation = await invitationService.create(
        orgId,
        ac,
        PRIVATE,
        c.req.valid("json"),
      );
      return c.json(invitation, 201);
    },
  );

  router.get("/organizations/:orgId/invitations", async (c) => {
    const ac = requireScopedAc(c, errors);
    const orgId = c.req.param("orgId");
    return c.json(await invitationService.getAllByOrgIds(ac, PRIVATE, orgId));
  });

  router.post(
    "/organizations/:orgId/invitations/:invitationId/revoke",
    async (c) => {
      const ac = requireScopedAc(c, errors);
      const orgId = c.req.param("orgId");
      await invitationService.revoke(
        ac,
        PRIVATE,
        orgId,
        c.req.param("invitationId"),
      );
      return c.json({ ok: true });
    },
  );

  return router;
}
