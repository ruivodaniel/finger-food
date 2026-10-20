/**
 * Gate middleware factory — 428 with the unmet obligations when a signed-in
 * caller doesn't satisfy the config's standing requirements.
 *
 * TLDR per request: signed-in caller → membership facts (injected resolver;
 * the org layer's seam — absent until org types ship, so everyone passes) →
 * gate service evaluates LIVE → blocked callers get 428 { obligations }.
 * Unauthenticated requests pass through: authentication is the routes'
 * concern, not the gate's.
 */

import type { MiddlewareHandler } from "hono";
import { PRIVATE } from "@libs/gated-scoped-ac";
import type { GateService } from "../services/gate.service";
import type { UserOrgMgmtEnv } from "../types";
import type { GateBlockBody } from "../../shared/types/gate";

export interface CreateGateMiddlewareOptions {
  gateService: GateService;
  /** Path prefixes the gate never blocks (resolve/check endpoints). */
  excludePaths?: string[];
}

/**
 * Segment-aware, mount-prefix-agnostic exclude match. The middleware sees the
 * full request path (e.g. `/api/client-v2/me/memberships`) but exclude
 * entries are declared relative to the client mount (`/me`). A trailing slash
 * means "this subtree only" (`/legal/` → `/legal/consent`, never `/legal`
 * alone). Without one, the last segment matches exactly OR its children
 * (`/me` → `/me` and `/me/security`, but never `/members`).
 */
export function isExcluded(path: string, excludePaths: string[]): boolean {
  return excludePaths.some((raw) => {
    if (raw.endsWith("/")) return path.includes(raw);
    return path.endsWith(raw) || path.includes(`${raw}/`);
  });
}

export function createGateMiddleware(
  options: CreateGateMiddlewareOptions,
): MiddlewareHandler<UserOrgMgmtEnv> {
  const excluded = options.excludePaths ?? [];
  return async (c, next) => {
    const user = c.get("user");
    const snapshot = c.get("sessionSnapshot");
    if (!user || !snapshot) return next();
    if (isExcluded(c.req.path, excluded)) return next();

    // AC42: this method also serves the private `/gate/check` route (threaded
    // normally there); the middleware passes `PRIVATE` directly rather than
    // the signature being split (doc rule 5's last sentence — holding the
    // stricter token is always safe).
    const result = await options.gateService.evaluate(PRIVATE, {
      userId: user.id,
      identityId: user.identityId,
      session: snapshot,
      memberships: c.get("session")?.memberships ?? [],
    });
    if (result.status === "blocked") {
      const body: GateBlockBody = { obligations: result.obligations };
      return c.json(body, 428);
    }
    return next();
  };
}
