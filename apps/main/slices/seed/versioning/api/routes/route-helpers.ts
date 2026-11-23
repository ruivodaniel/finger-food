// Who is acting: always the session's user. No author is ever read from the request.

import type { Author } from "@libs/versioning";
import type { Context } from "hono";
import type { Asker } from "../services/versioning.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { VersioningContextVariables, VersioningEnv } from "../types";

export function requireAuthor(user: VersioningContextVariables["user"], errors: ModuleErrors): Author {
  if (!user) throw errors.unauthorized("authentication required");
  return { id: user.id, type: "user" };
}

/** Who is asking, for the entity's owner to judge: a signed-in user, and the request's access context, unread. */
export function askerOf(c: Context<VersioningEnv>, errors: ModuleErrors): Asker {
  requireAuthor(c.get("user"), errors);
  return { scopedAc: c.get("scopedAc") };
}
