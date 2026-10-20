/**
 * Hook emissions never throw into the emitter.
 *
 * Services await their hook callbacks after the mutation committed, and the
 * response they return must not depend on what a consumer does with the fact —
 * so the mount wraps every callback the app hands it here: run it, swallow any
 * rejection, log it under the hook's name. Consumers stay ordinary async
 * functions; the seam defends itself.
 */

import type { UserOrgMgmtHooks } from "../../shared/types/hooks";
import type { ModuleLogger } from "./module-errors";

export function guardHooks(
  hooks: UserOrgMgmtHooks,
  logger: ModuleLogger,
): UserOrgMgmtHooks {
  const guarded: Record<string, unknown> = {};
  for (const [name, callback] of Object.entries(hooks)) {
    if (typeof callback !== "function") continue;
    guarded[name] = (...args: unknown[]) =>
      Promise.resolve()
        .then(() => (callback as (...a: unknown[]) => unknown)(...args))
        .then(
          () => undefined,
          (error: unknown) => {
            logger.error("hook consumer failed", {
              hook: name,
              errorMessage:
                error instanceof Error ? error.message : String(error),
            });
          },
        );
  }
  return guarded as UserOrgMgmtHooks;
}
