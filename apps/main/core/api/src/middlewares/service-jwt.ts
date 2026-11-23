/**
 * Machine-to-machine: a service JWT from another app (the orchestrator). HS256
 * with the shared secret; the direction is fixed by iss/aud; the lifetime is
 * short. No session, no user: the caller is an app.
 */

import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";

export interface ServiceJwtOptions {
  secret: string | undefined;
  issuer: string;
  audience: string;
  /** seconds */
  maxLifetime: number;
}

export function createServiceJwtMiddleware(opts: ServiceJwtOptions): MiddlewareHandler {
  return async (c, next) => {
    if (!opts.secret) throw new HTTPException(503, { message: "m2m is not configured (SERVICE_JWT_SECRET)" });
    const header = c.req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) throw new HTTPException(401, { message: "missing bearer token" });
    let payload: Record<string, unknown>;
    try {
      payload = await verify(token, opts.secret, "HS256");
    } catch {
      throw new HTTPException(401, { message: "invalid or expired token" });
    }
    const aud = payload.aud;
    const audOk = aud === opts.audience || (Array.isArray(aud) && aud.includes(opts.audience));
    const iat = typeof payload.iat === "number" ? payload.iat : undefined;
    const exp = typeof payload.exp === "number" ? payload.exp : undefined;
    if (payload.iss !== opts.issuer || !audOk || iat === undefined || exp === undefined || exp - iat > opts.maxLifetime) {
      throw new HTTPException(401, { message: "token not accepted" });
    }
    await next();
  };
}
