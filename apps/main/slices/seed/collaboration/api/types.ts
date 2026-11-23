// Hono context variables the slice's routes read. The app's session middleware sets `user`; the slice needs only its id,
// so it declares the narrowest shape that works and stays independent of the slice that owns sessions.

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";

export interface CollaborationContextVariables {
  user: { id: string } | null;
  /** The request's access context, built by the app's scoped-AC middleware: who may lock and unlock is the app's rules. */
  scopedAc?: ScopedAcRequestContext;
}

export type CollaborationEnv = { Variables: CollaborationContextVariables };
