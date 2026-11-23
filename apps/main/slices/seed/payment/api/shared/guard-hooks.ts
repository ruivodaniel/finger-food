/**
 * Hook emissions never throw into the emitter: the mount wraps every callback
 * the app hands it — run it, swallow any rejection, log it under the hook's
 * name. A failing consumer costs a log line, never a webhook's 200.
 */

import type { PaymentHooks } from "../../shared/hooks";
import type { ModuleLogger } from "./module-errors";

export function guardHooks(hooks: PaymentHooks, logger: ModuleLogger): PaymentHooks {
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
              errorMessage: error instanceof Error ? error.message : String(error),
            });
          },
        );
  }
  return guarded as PaymentHooks;
}
