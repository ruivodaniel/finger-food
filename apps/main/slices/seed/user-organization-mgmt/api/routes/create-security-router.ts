/**
 * Security router factory — the caller's own credential-security controls.
 * The caller and its session-context id are ALWAYS resolved from the session
 * (context vars); no identity is ever read from the request.
 *
 * Routes:
 *   GET  /me/security                   { totpEnrolled, backupCodesGenerated }
 *   POST /me/security/totp/enroll       start TOTP → { flowId, totpSecret, qrDataUrl }
 *   POST /me/security/totp/confirm      confirm code → { backupCodes } (shown once)
 *   POST /me/security/backup-codes      regenerate → { backupCodes }
 *   POST /me/security/step-up           raise the session to AAL2 (totp/backup)
 *   POST /me/security/totp/disable      remove TOTP (needs a prior step-up)
 *   POST /me/security/sessions/revoke-others  sign out every other device
 */

import { PRIVATE } from "@libs/gated-scoped-ac";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import type { SecurityService } from "../services/security.service";
import type { ModuleErrors } from "../shared/module-errors";
import { requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateSecurityRouterOptions {
  securityService: SecurityService;
  errors: ModuleErrors;
}

const CodeSchema = z.object({ code: z.string().min(1) });

export function createSecurityRouter(options: CreateSecurityRouterOptions) {
  const { securityService, errors } = options;
  const router = new Hono<UserOrgMgmtEnv>();

  /** The caller's provider session token (their cookie's value), or 401. */
  const requireToken = (c: {
    get: (k: "sessionToken") => string | null;
  }): string => {
    const token = c.get("sessionToken");
    if (!token) throw errors.unauthorized("no session");
    return token;
  };

  router.get("/me/security", async (c) => {
    const user = requireUser(c, errors);
    return c.json(await securityService.status(PRIVATE, user.id));
  });

  router.post("/me/security/totp/enroll", async (c) => {
    requireUser(c, errors);
    return c.json(await securityService.startTotp(PRIVATE, requireToken(c)));
  });

  router.post(
    "/me/security/totp/confirm",
    zValidator(
      "json",
      z.object({ flowId: z.string().min(1), code: z.string().min(1) }),
    ),
    async (c) => {
      requireUser(c, errors);
      const body = c.req.valid("json");
      return c.json(
        await securityService.confirmTotp(
          PRIVATE,
          requireToken(c),
          body.flowId,
          body.code,
        ),
      );
    },
  );

  router.post("/me/security/backup-codes", async (c) => {
    requireUser(c, errors);
    return c.json(
      await securityService.regenerateBackupCodes(PRIVATE, requireToken(c)),
    );
  });

  router.post(
    "/me/security/step-up",
    zValidator(
      "json",
      CodeSchema.extend({
        method: z.enum(["totp", "backup_code"]).default("totp"),
      }),
    ),
    async (c) => {
      requireUser(c, errors);
      const body = c.req.valid("json");
      await securityService.stepUp(PRIVATE, requireToken(c), {
        code: body.code,
        method: body.method,
      });
      return c.json({ ok: true });
    },
  );

  router.post("/me/security/totp/disable", async (c) => {
    requireUser(c, errors);
    await securityService.disableTotp(PRIVATE, requireToken(c));
    return c.json({ ok: true });
  });

  router.post("/me/security/sessions/revoke-others", async (c) => {
    requireUser(c, errors);
    await securityService.signOutOtherSessions(PRIVATE, requireToken(c));
    return c.json({ ok: true });
  });

  return router;
}
