// Who is asking: this browser tab, from x-client, and its actor, always the session's user. No actor is ever read from the
// request.

import type { Context } from "hono";
import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import type { ModuleErrors } from "../shared/module-errors";
import type { CollaborationEnv } from "../types";

export interface Client {
  clientId: string;
  actorId: string;
}

export function requireClient(c: Context<CollaborationEnv>, errors: ModuleErrors): Client {
  const user = c.get("user");
  if (!user) throw errors.unauthorized("authentication required");
  const clientId = c.req.header("x-client");
  if (!clientId) throw errors.badRequest("this route needs x-client: the browser tab it comes from");
  return { clientId, actorId: user.id };
}

/** The request's access context, built by the app's scoped-AC middleware; none ⇒ 401. */
export function requireScopedAc(c: Context<CollaborationEnv>, errors: ModuleErrors): ScopedAcRequestContext & { userId: string } {
  const user = c.get("user");
  const ac = c.get("scopedAc");
  if (!user || !ac) throw errors.unauthorized("authentication required");
  return { ...ac, userId: user.id };
}

/** Who is asking, for the kind to judge: the request's access context, unread. */
export function askerOf(c: Context<CollaborationEnv>): { scopedAc: unknown } {
  return { scopedAc: c.get("scopedAc") };
}
