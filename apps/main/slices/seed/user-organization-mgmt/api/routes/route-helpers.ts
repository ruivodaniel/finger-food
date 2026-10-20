// Shared route utilities — caller resolution and request metadata.

import type { Context } from "hono";
import type { ScopedAcEnv, UserOrgMgmtEnv } from "../types";
import type { UomUserSelect } from "../models/user.model";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type { ModuleErrors } from "../shared/module-errors";

/** The authenticated caller — set by the session middleware, never by input. */
export function requireUser(
  c: Context<UserOrgMgmtEnv>,
  errors: ModuleErrors,
): UomUserSelect {
  const user = c.get("user");
  if (!user) throw errors.unauthorized("authentication required");
  return user;
}

/**
 * The caller's scoped-AC request context — the bag + effective permissions +
 * bag-bound gated-db handle the hydration middleware built once this request
 * (AC14). It is the sole channel through which a service resolves a Scope and
 * reaches the DB under it (AC41). Absent only on unauthenticated requests, so a
 * private route that reaches here without it is a 401 — same shape as
 * `requireUser`. The middleware writes `scopedAc` on the app-level `ScopedAcEnv`;
 * private module routers stay typed `UserOrgMgmtEnv`, so we read it through a
 * localized env widening rather than retyping every router.
 */
export function requireScopedAc(
  c: Context<UserOrgMgmtEnv>,
  errors: ModuleErrors,
): ScopedAcRequestContext {
  const ac = (c as unknown as Context<ScopedAcEnv>).get("scopedAc");
  if (!ac) throw errors.unauthorized("authentication required");
  return ac;
}

/** Consent audit metadata from the request. */
export function requestMeta(c: Context): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress:
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: c.req.header("user-agent") ?? undefined,
  };
}
