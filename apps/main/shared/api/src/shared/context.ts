// HonoContext type (requestId, session slots, scoped-AC request context)
import type { RequestIdVariables } from "hono/request-id";
import type {
  ScopedAcRequestContext,
  UserOrgMgmtContextVariables,
} from "@modules/user-organization-mgmt/api";

export type HonoContext = {
  Variables: RequestIdVariables &
    UserOrgMgmtContextVariables & {
      // Per-request AC context (bag + roles + permissions + gated-db handle),
      // built by the module's scoped-AC hydration middleware (UOM13). Optional:
      // public / unauthenticated requests carry none (AC3, AC22).
      scopedAc?: ScopedAcRequestContext;
    };
};
