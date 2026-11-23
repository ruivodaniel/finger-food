import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { Context } from "hono";
import type { ModuleErrors } from "../shared/module-errors";
import type { ImplementationPatternsEnv } from "../types";

/** The access context the app's hydration middleware built; none ⇒ 401. */
export function requireScopedAc(c: Context<ImplementationPatternsEnv>, errors: ModuleErrors): ScopedAcRequestContext {
  const ac = c.get("scopedAc");
  if (!ac) throw errors.unauthorized("authentication required");
  return ac;
}
