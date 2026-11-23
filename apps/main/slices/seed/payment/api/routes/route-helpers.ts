/**
 * Route helpers — the access context a gated route stands on. The billing
 * owner is never taken from the URL or the body: the account service derives
 * it from the session (`scope=account` is the caller, `scope=organization`
 * the caller's active organization).
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { Context } from "hono";
import type { ModuleErrors } from "../shared/module-errors";
import type { PaymentEnv } from "../types";

export function requireScopedAc(c: Context<PaymentEnv>, errors: ModuleErrors): ScopedAcRequestContext {
  const ac = c.get("scopedAc");
  if (!ac) throw errors.unauthorized("authentication required");
  return ac;
}
