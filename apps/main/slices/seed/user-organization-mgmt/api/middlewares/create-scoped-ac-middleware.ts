/**
 * Scoped-AC hydration middleware (UOM13 — the module's one architectural
 * distinction). Slots between the session and gate middlewares (API21:
 * session -> hydration -> gate -> routers).
 *
 * Per authenticated request it builds the subjects bag ONCE (AC14), resolves the
 * effective permissions ONCE, and stashes the bag + roles + permissions + a
 * bag-bound gated-db handle on `scopedAc` for every downstream layer to reuse.
 * The engine and gate are injected (AC37) — the module never constructs them.
 *
 * The session middleware already re-resolved the caller's memberships from the
 * DB this request (AC15) and validated the active-org header against them, so
 * roles + org type are read off that single server-side resolution rather than
 * re-queried here (AC14 — context is hydrated once, not recomputed per layer).
 *
 * Public / unauthenticated requests carry no session, so they get no AC context
 * and pass straight through (AC3, AC22) — hydration never rejects.
 */

import type { MiddlewareHandler } from "hono";

import type { Ac, GatedDb, SchemaTables, ScopedAcBag, ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { ScopedAcEnv } from "../types";

export interface CreateScopedAcMiddlewareOptions {
  /** The config-bound engine (createAc); only role->permission resolution here. */
  engine: Pick<Ac, "resolveEffectivePermissions">;
  /** The gated-db factory (createGatedDb): bag -> the per-request DB handle. */
  gatedDb: (bag: unknown) => GatedDb<SchemaTables>;
  /**
   * Roles every authenticated user always holds (the account baseline). The app
   * derives these from config; the module stays config-blind (AC37). Included in
   * each request's role set so the baseline's permissions actually apply.
   */
  baselineRoles: string[];
}

export function createScopedAcMiddleware(
  options: CreateScopedAcMiddlewareOptions,
): MiddlewareHandler<ScopedAcEnv> {
  return async (c, next) => {
    const user = c.get("user");
    const session = c.get("session");
    // No session -> public / unauthenticated: no AC context, no error (AC3, AC22).
    if (!user || !session) return next();

    // Active org arrives as a client request header (ACTIVE_ORG_HEADER), already
    // validated against the caller's real memberships and echoed as
    // `activeOrganizationId` (UOM12/API35). Its roles + org type come from that
    // server-resolved membership — never a client-asserted role (AC15).
    const activeOrgId = session.activeOrganizationId;
    const activeMembership = activeOrgId
      ? (session.memberships.find((m) => m.organizationId === activeOrgId) ??
        null)
      : null;

    c.set("scopedAc", buildScopedAc(options, user.id, activeMembership));

    await next();
  };
}

/**
 * The AC context of a signed-in user acting in `activeMembership`'s org (null:
 * no active org). Every request's context is built here; registration builds
 * the new user's here too, so both get the same bag and permissions.
 */
export function buildScopedAc(
  options: CreateScopedAcMiddlewareOptions,
  userId: string,
  activeMembership: {
    organizationId: string;
    orgType: string;
    roles: string[];
  } | null,
): ScopedAcRequestContext {
  const { engine, gatedDb, baselineRoles } = options;

  const bag: ScopedAcBag = {
    session: {
      user: { id: userId },
      organization: activeMembership
        ? {
            id: activeMembership.organizationId,
            type: activeMembership.orgType,
          }
        : null,
    },
  };

  // Baseline roles always; the active org's membership roles only when an org
  // is in context (AC16/AC19).
  const roles = [...baselineRoles, ...(activeMembership?.roles ?? [])];

  // Resolve permissions ONCE here (AC14); downstream layers receive the result.
  const permissions = engine.resolveEffectivePermissions(roles, bag);

  // The bag-bound handle is the only way to reach the DB under a Scope (AC41).
  return { bag, roles, permissions, gateDb: gatedDb(bag) };
}
