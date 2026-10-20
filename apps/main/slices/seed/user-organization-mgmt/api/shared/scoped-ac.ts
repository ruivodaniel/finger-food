/**
 * Scoped-AC request context — the shape the hydration middleware (UOM13) builds
 * once per request and every downstream layer receives (AC14, never recomputed).
 *
 * The engine and gate are the app-owned instances injected at mount (AC37: the
 * module may know the lib's TYPES but never constructs or configures them). This
 * file only names the request-scoped values that travel in the context (AC41).
 */

import type { GatedDb, SchemaTables } from "@libs/gated-scoped-ac";

/**
 * The nested session-subjects bag (D3) forwarded to the engine as `subjects`.
 * The config's paths resolve against it: `$session.user.id`,
 * `$session.organization.id`, `$session.organization.type`.
 */
export interface ScopedAcBag {
  session: {
    user: { id: string };
    /** null when no active org is in context (AC19). */
    organization: { id: string; type: string } | null;
  };
}

/** The per-request AC context stashed on the `scopedAc` context var. */
export interface ScopedAcRequestContext {
  /** The subjects bag (D3) — passed to every engine resolve/allow call. */
  bag: ScopedAcBag;
  /**
   * Effective role set: the injected baseline role(s) plus the active org's
   * membership roles (AC16/AC19). Server-resolved, never client-asserted (AC15).
   */
  roles: string[];
  /**
   * Effective permissions, resolved once from `roles` (AC14) — what the engine's
   * resolvers and create/update verdicts consume downstream.
   */
  permissions: string[];
  /** Bag-bound gated-db handle — the sole path to the DB for scoped work (AC41). */
  gateDb: GatedDb<SchemaTables>;
}
