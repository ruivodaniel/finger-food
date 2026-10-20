/**
 * Gate router factory — the frontend guard's proactive probe. Same
 * evaluation as the gate middleware (one implementation, two entry points):
 * the middleware ENFORCES on domain requests; this route lets the client ask
 * "am I gated?" before mounting a protected page, and lets resolve screens
 * re-check after each resolved obligation.
 *
 * Routes:
 *   GET /gate/check   200 { status: "clear" } | 428 { obligations }
 */

import { PRIVATE } from "@libs/gated-scoped-ac";
import { Hono } from "hono";

import type { GateService } from "../services/gate.service";
import type { ModuleErrors } from "../shared/module-errors";
import { requireUser } from "./route-helpers";
import type { UserOrgMgmtEnv } from "../types";

export interface CreateGateRouterOptions {
  gateService: GateService;
  errors: ModuleErrors;
}

export function createGateRouter(options: CreateGateRouterOptions) {
  const router = new Hono<UserOrgMgmtEnv>();

  router.get("/gate/check", async (c) => {
    const user = requireUser(c, options.errors);
    const snapshot = c.get("sessionSnapshot");
    if (!snapshot) throw options.errors.unauthorized("no session");

    const result = await options.gateService.evaluate(PRIVATE, {
      userId: user.id,
      identityId: user.identityId,
      session: snapshot,
      memberships: c.get("session")?.memberships ?? [],
    });
    if (result.status === "blocked") {
      return c.json({ obligations: result.obligations }, 428);
    }
    return c.json({ status: "clear" });
  });

  return router;
}
