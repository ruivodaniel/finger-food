// Hono context variables the module's middlewares set and its routes read.

import type { SessionView } from "../shared/types/domain";
import type { SessionSnapshot } from "./identity/identity-provider.port";
import type { UomUserSelect } from "./models/user.model";
import type { ScopedAcRequestContext } from "./shared/scoped-ac";

export interface UserOrgMgmtContextVariables {
  user: UomUserSelect | null;
  session: SessionView | null;
  /** Raw provider session facts (aal, methods) — the gate's session layer. */
  sessionSnapshot: SessionSnapshot | null;
  /**
   * The provider session token — the cookie's value. Server-side only: it
   * never appears in a response. Settings and step-up operations act on it.
   */
  sessionToken: string | null;
}

export type UserOrgMgmtEnv = { Variables: UserOrgMgmtContextVariables };

/**
 * Env for the scoped-AC hydration middleware (UOM13): the session vars it reads
 * plus the `scopedAc` request context it writes. The app's own context declares
 * the same optional slot (typed by the re-exported `ScopedAcRequestContext`), so
 * the middleware mounts on the app router unchanged.
 */
export type ScopedAcEnv = {
  Variables: UserOrgMgmtContextVariables & {
    scopedAc?: ScopedAcRequestContext;
  };
};
