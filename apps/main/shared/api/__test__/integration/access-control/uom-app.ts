/**
 * The UOM slice over HTTP, for integration tests: its REAL router, services
 * and drizzle repos (`mountUserOrgApi`) behind its REAL scoped-AC hydration
 * middleware, on the harness's PGlite db and the given access-control config.
 *
 * Only the session lookup is stubbed — kratos is out of scope, as in the
 * harness: the caller comes from TEST_USER_HEADER, their memberships from the
 * db, and the active org is honored only when it names one of them (the rule
 * `SessionService.resolve` applies). The gate middleware (obligations) is not
 * mounted.
 */

import { eq } from "drizzle-orm";
import { Hono, type MiddlewareHandler } from "hono";

import { createAc, createGatedDb } from "@libs/gated-scoped-ac";
import { accessControlConfig } from "@configs/access-control";
import { PREFERENCES } from "@configs/product/preferences.config";
import { authenticationAndRegistration } from "@configs/user-organization-mgmt/auth/authentication.config";
import { organizationCreationAndJoining } from "@configs/user-organization-mgmt/auth/org-lifecycle.config";
import {
  mountUserOrgApi,
  type ScopedAcEnv,
} from "@modules/user-organization-mgmt/api";
import { FakeIdentityPort } from "../../../../../slices/seed/user-organization-mgmt/api/testing/fake-identity-port";
import { uomUser } from "@modules/user-organization-mgmt/models";
import { ACTIVE_ORG_HEADER } from "@modules/user-organization-mgmt/shared";
import * as AppError from "@/shared/error";

import { baselineRoles, idColumns, tables, type TestDb } from "./harness";

const moduleErrors = {
  notFound: (message?: string) => new AppError.NotFound(message),
  badRequest: (message?: string) => new AppError.BadRequest(message),
  unauthorized: (message?: string) => new AppError.Unauthorized(message),
  forbidden: (message?: string) => new AppError.Forbidden(message),
  internalError: (message?: string) => new AppError.InternalServerError(message),
};

const silentLogger = { info: () => {}, warn: () => {}, error: () => {} };

/** Which caller a request is — the stub's stand-in for the session cookie. */
export const TEST_USER_HEADER = "x-test-user";

export function makeUomApp(
  db: TestDb,
  config: typeof accessControlConfig = accessControlConfig,
) {
  const engine = createAc({ ...config, tables });
  const gate = createGatedDb(db, { tables, engine, idColumns });
  let nextId = 0;

  const uom = mountUserOrgApi({
    db: db as never,
    createId: () => `id-${++nextId}`,
    engine,
    gatedDb: (bag) => gate(bag as never),
    baselineRoles,
    authConfig: authenticationAndRegistration,
    orgConfig: organizationCreationAndJoining,
    preferences: PREFERENCES,
    identityProvider: new FakeIdentityPort(),
    storage: {
      presignPut: async (key) => ({
        uploadUrl: `https://storage.invalid/${key}?signed`,
        publicUrl: `https://storage.invalid/${key}`,
      }),
    },
    errors: moduleErrors,
    logger: silentLogger,
  });

  const session: MiddlewareHandler<ScopedAcEnv> = async (c, next) => {
    c.set("user", null);
    c.set("session", null);
    c.set("sessionSnapshot", null);
    c.set("sessionToken", null);
    const userId = c.req.header(TEST_USER_HEADER);
    if (userId) {
      const [user] = await db.select().from(uomUser).where(eq(uomUser.id, userId));
      const memberships =
        await uom.services.membership.getMembershipFactsByUserId(userId);
      const requested = c.req.header(ACTIVE_ORG_HEADER) ?? null;
      c.set("user", user);
      c.set("session", {
        id: `session-${userId}`,
        userId,
        activeOrganizationId:
          requested && memberships.some((m) => m.organizationId === requested)
            ? requested
            : null,
        memberships,
        aal: "aal1",
        methods: ["password"],
        expiresAt: "2030-01-01T00:00:00.000Z",
      });
    }
    await next();
  };

  const app = new Hono<ScopedAcEnv>()
    .use("*", session)
    .use("*", uom.scopedAcMiddleware)
    .route("/", uom.router);
  app.onError((err, c) =>
    err instanceof AppError.BaseAppError
      ? c.json({ error: err.message }, err.statusCode)
      : c.json({ error: String(err) }, 500),
  );
  return app;
}

export type UomApp = ReturnType<typeof makeUomApp>;

export async function call(
  app: UomApp,
  method: string,
  path: string,
  who: { as: string; actingIn?: string | null },
  body?: unknown,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = { [TEST_USER_HEADER]: who.as };
  if (who.actingIn) headers[ACTIVE_ORG_HEADER] = who.actingIn;
  if (body !== undefined) headers["content-type"] = "application/json";
  const res = await app.request(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}
