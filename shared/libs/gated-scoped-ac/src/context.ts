// The per-request access context: built once per request by the app's hydration
// middleware, then passed to every scoped read and write. The one exception to
// "the library knows nothing about the app" (AC37): it names the app's session
// shape, so every slice and app reads one definition instead of redeclaring it.
// The engine and gate still take the bag as `unknown`, and the bag matches the
// engine's default `orgTypePath`, `$session.organization.type`.

import type { GatedDb } from "./gate";
import type { SchemaTables } from "./engine";

// The session-subjects bag (D3) handed to the engine as `subjects`. The config's
// paths resolve against it: `$session.user.id`, `$session.organization.id`,
// `$session.organization.type`.
export interface ScopedAcBag {
  session: {
    user: { id: string };
    // null when no active organization is in context (AC19)
    organization: { id: string; type: string } | null;
  };
}

export interface ScopedAcRequestContext {
  // the subjects bag, passed to every engine resolve/allow call
  bag: ScopedAcBag;
  // the baseline role(s) plus the active organization's membership roles
  // (AC16/AC19), resolved on the server, never asserted by the client (AC15)
  roles: string[];
  // resolved once from `roles` (AC14): what the resolvers and the create/update
  // verdicts read downstream
  permissions: string[];
  // the bag-bound gated db, the only path to the db for scoped work (AC41)
  gateDb: GatedDb<SchemaTables>;
}
