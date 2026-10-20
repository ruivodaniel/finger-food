/**
 * Session middleware — cookie → provider session → context vars.
 *
 * Per request: read the cookie (its value is the provider session token),
 * resolve it (provider whoami behind a short facts cache) and stash
 * user/session/snapshot/token on the context. A value the provider doesn't
 * recognize is simply not a session.
 *
 * Never rejects: unauthenticated requests pass through with null vars, and the
 * routes and the gate decide what that means.
 */

import type { MiddlewareHandler } from "hono";
import { ACTIVE_ORG_HEADER } from "../../shared/types/domain";
import type { SessionService } from "../services/session.service";
import { readSessionCookie, type SessionCookieConfig } from "../shared/cookies";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateSessionMiddlewareOptions {
  sessionService: SessionService;
  cookie: SessionCookieConfig;
}

export function createSessionMiddleware(
  options: CreateSessionMiddlewareOptions,
): MiddlewareHandler<UserOrgMgmtEnv> {
  return async (c, next) => {
    c.set("user", null);
    c.set("session", null);
    c.set("sessionSnapshot", null);
    c.set("sessionToken", null);

    const sessionToken = readSessionCookie(c, options.cookie) ?? null;

    if (sessionToken) {
      const resolved = await options.sessionService.resolve(
        sessionToken,
        c.req.header(ACTIVE_ORG_HEADER) ?? null,
      );
      if (resolved) {
        c.set("user", resolved.user);
        c.set("session", resolved.view);
        c.set("sessionSnapshot", resolved.snapshot);
        c.set("sessionToken", sessionToken);
      }
    }
    await next();
  };
}
