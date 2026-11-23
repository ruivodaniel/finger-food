/**
 * The Hono variables this slice's routes read. The access context is the one
 * user-organization-mgmt's hydration middleware builds once per request.
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";

export type PaymentEnv = {
  Variables: {
    user: { id: string } | null;
    scopedAc?: ScopedAcRequestContext;
  };
};
