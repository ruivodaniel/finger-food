/**
 * Auth router — the module's credential surface (the authMount at /api/auth).
 * HTTP transport only: parse, call the , set/clear the session cookie,
 * respond.
 *
 * A credential conversation is the PROVIDER's flow and the client holds its id;
 * the module holds no flow records. Every registration is a code registration:
 * the start delivers the code and NOTHING exists yet; the verify request
 * carries code + name + consents + password together and births the identity,
 * address verified, password set on the fresh session.
 *
 *   GET  /config?intent=&identifier=     derived auth options (leak-proof)
 *   POST /register                       identifier + name? + consents? + password?
 *                                        → 202, a code was delivered
 *   POST /register/verify                prove the code → the identity is born,
 *                                        signed in (password lands with it)
 *   POST /login                          password → signed in
 *   POST /login/code/start               deliver an OTP  (always answers)
 *   POST /login/code/complete            prove it → signed in
 *   POST /recovery/start                 deliver a recovery code (always answers)
 *   POST /recovery/complete              prove it → signed in (the proof IS a
 *                                        credential proof)
 *   POST /recovery/finish                signed-in: new password, every session
 *                                        revoked (this one included)
 *   GET  /session                        current session + user
 *   POST /logout                         end the session (clears the cookie)
 *
 * There is no login-time 2FA here: TOTP is a GATE demand (membership rules) and
 * is raised on the live session at /me/security/step-up.
 */

import { PUBLIC } from "@libs/gated-scoped-ac";
import { Hono, type Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import { IDENTIFIERS, INTENTS } from "../../shared/auth-config/types";
import type { AuthService, LoginResult } from "../services/auth.service";
import type { SessionService } from "../services/session.service";
import type { UserService } from "../services/user.service";
import {
  clearSessionCookie,
  writeSessionCookie,
  type SessionCookieConfig,
} from "../shared/cookies";
import type { ModuleErrors } from "../shared/module-errors";
import { requestMeta } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

const IdentifierNameSchema = z.enum(
  IDENTIFIERS.map((i) => i.name) as [string, ...string[]],
);

const IdentifierSchema = z.object({
  identifierType: IdentifierNameSchema,
  identifierValue: z.string().min(1),
});

const ConsentsSchema = z
  .array(
    z.object({
      type: z.enum(["termsAndConditions", "privacyPolicy", "marketing"]),
      accepted: z.boolean(),
    }),
  )
  .optional();

const CodeSchema = z.object({ code: z.string().min(1) });

export interface CreateAuthRouterOptions {
  authService: AuthService;
  sessionService: SessionService;
  userService: UserService;
  cookie: SessionCookieConfig;
  errors: ModuleErrors;
}

export function createAuthRouter(options: CreateAuthRouterOptions) {
  const { authService, sessionService, userService, cookie } = options;
  const router = new Hono<UserOrgMgmtEnv>();

  router.get(
    "/config",
    zValidator(
      "query",
      z.object({
        intent: z.enum(INTENTS).default("authentication"),
        identifier: IdentifierNameSchema.optional(),
      }),
    ),
    (c) => {
      const { intent, identifier } = c.req.valid("query");
      return c.json(
        authService.authConfigView(PUBLIC, {
          intent,
          identifier: identifier as never,
        }),
      );
    },
  );

  // ── Registration ───────────────────────────────────────────────────────────

  router.post(
    "/register",
    zValidator(
      "json",
      IdentifierSchema.extend({
        password: z.string().optional(),
        name: z.string().min(1).max(200).optional(),
        consents: ConsentsSchema,
        invitationId: z.string().optional(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json");
      const { flowId } = await authService.register(PUBLIC, {
        identifier: {
          type: body.identifierType as never,
          value: body.identifierValue,
        },
        password: body.password,
        name: body.name,
        consents: body.consents,
        invitationId: body.invitationId,
      });
      return c.json({ codeSent: true, flowId }, 202);
    },
  );

  router.post(
    "/register/verify",
    zValidator(
      "json",
      IdentifierSchema.extend({
        flowId: z.string().min(1),
        code: z.string().min(1),
        name: z.string().min(1).max(200).optional(),
        password: z.string().optional(),
        consents: ConsentsSchema,
        invitationId: z.string().optional(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json");
      const result = await authService.registerVerify(
        PUBLIC,
        {
          flowId: body.flowId,
          identifier: {
            type: body.identifierType as never,
            value: body.identifierValue,
          },
          code: body.code,
          name: body.name,
          password: body.password,
          consents: body.consents,
          invitationId: body.invitationId,
        },
        requestMeta(c),
      );
      writeSessionCookie(c, cookie, result.sessionToken);
      return c.json(
        { user: await userService.getMe(PUBLIC, result.userId) },
        201,
      );
    },
  );

  // ── Login ──────────────────────────────────────────────────────────────────

  /** Any credential proof ends the same way: cookie set, user returned. */
  const signIn = async (c: Context<UserOrgMgmtEnv>, result: LoginResult) => {
    writeSessionCookie(c, cookie, result.sessionToken);
    return c.json(await userService.getMe(PUBLIC, result.userId));
  };

  router.post(
    "/login",
    zValidator(
      "json",
      IdentifierSchema.extend({ password: z.string().min(1) }),
    ),
    async (c) => {
      const body = c.req.valid("json");
      return signIn(
        c,
        await authService.loginWithPassword(PUBLIC, {
          identifier: {
            type: body.identifierType as never,
            value: body.identifierValue,
          },
          password: body.password,
        }),
      );
    },
  );

  router.post(
    "/login/code/start",
    zValidator("json", IdentifierSchema),
    async (c) => {
      const body = c.req.valid("json");
      const { flowId } = await authService.loginCodeStart(PUBLIC, {
        identifier: {
          type: body.identifierType as never,
          value: body.identifierValue,
        },
      });
      return c.json({ flowId });
    },
  );

  router.post(
    "/login/code/complete",
    zValidator(
      "json",
      IdentifierSchema.extend({ flowId: z.string().min(1) }).merge(CodeSchema),
    ),
    async (c) => {
      const body = c.req.valid("json");
      return signIn(
        c,
        await authService.loginCodeComplete(PUBLIC, {
          flowId: body.flowId,
          identifier: {
            type: body.identifierType as never,
            value: body.identifierValue,
          },
          code: body.code,
        }),
      );
    },
  );

  // ── Recovery ───────────────────────────────────────────────────────────────

  router.post(
    "/recovery/start",
    zValidator("json", IdentifierSchema),
    async (c) => {
      const body = c.req.valid("json");
      const { flowId } = await authService.recoveryStart(PUBLIC, {
        identifier: {
          type: body.identifierType as never,
          value: body.identifierValue,
        },
      });
      return c.json({ flowId });
    },
  );

  router.post(
    "/recovery/complete",
    zValidator(
      "json",
      IdentifierSchema.extend({ flowId: z.string().min(1) }).merge(CodeSchema),
    ),
    async (c) => {
      const body = c.req.valid("json");
      return signIn(
        c,
        await authService.recoveryComplete(PUBLIC, {
          flowId: body.flowId,
          identifier: {
            type: body.identifierType as never,
            value: body.identifierValue,
          },
          code: body.code,
        }),
      );
    },
  );

  router.post(
    "/recovery/finish",
    zValidator(
      "json",
      z.object({
        newPassword: z.string().min(1),
        identifierType: IdentifierNameSchema.optional(),
      }),
    ),
    async (c) => {
      const sessionToken = c.get("sessionToken");
      if (!sessionToken) throw options.errors.unauthorized("no session");
      const body = c.req.valid("json");
      await authService.recoveryFinish(PUBLIC, {
        sessionToken,
        newPassword: body.newPassword,
        identifierType: body.identifierType as never,
      });
      clearSessionCookie(c, cookie); // every session was revoked — including this one
      return c.json({ ok: true });
    },
  );

  // ── Session ────────────────────────────────────────────────────────────────

  router.get("/session", async (c) => {
    const user = c.get("user");
    const session = c.get("session");
    if (!user || !session) return c.json({ user: null, session: null });
    return c.json({ user: await userService.getMe(PUBLIC, user.id), session });
  });

  router.post("/logout", async (c) => {
    const sessionToken = c.get("sessionToken");
    if (sessionToken) await sessionService.logout(PUBLIC, sessionToken);
    clearSessionCookie(c, cookie);
    return c.json({ ok: true });
  });

  return router;
}
