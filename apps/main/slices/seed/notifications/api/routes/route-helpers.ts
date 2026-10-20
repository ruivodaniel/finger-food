// Shared route utilities — caller resolution. The recipient is ALWAYS the
// session's user; no user id is ever read from the request.

import type { Context } from "hono";
import type { ModuleErrors } from "../shared/module-errors";
import type { NotificationsEnv } from "../types";

export function requireUserId(
  c: Context<NotificationsEnv>,
  errors: ModuleErrors,
): string {
  const user = c.get("user");
  if (!user) throw errors.unauthorized("authentication required");
  return user.id;
}
