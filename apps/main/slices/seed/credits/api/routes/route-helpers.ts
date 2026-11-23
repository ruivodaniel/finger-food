/**
 * Route helpers — the access context a gated route stands on. The credit
 * owner is never taken from the URL or the body: the account service derives
 * it from the session (`scope=account` is the caller, `scope=organization`
 * the caller's active organization).
 */

import type { ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { zValidator } from "@hono/zod-validator";
import type { Context } from "hono";
import type { ZodType } from "zod";
import type { ModuleErrors } from "../shared/module-errors";
import type { CreditsEnv } from "../types";

export function requireScopedAc(c: Context<CreditsEnv>, errors: ModuleErrors): ScopedAcRequestContext {
  const ac = c.get("scopedAc");
  if (!ac) throw errors.unauthorized("authentication required");
  return ac;
}

/** One sentence per thing wrong with the request, naming the field: what the person or the developer reads. */
const reasonOf = (issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>): string =>
  issues.map((issue) => `${issue.path.length ? issue.path.map(String).join(".") : "the request"}: ${issue.message}`).join("; ");

/**
 * Validates a route's query or body. A request of the wrong shape is refused like every other refusal of the slice, as a
 * bad request with its reason in words, so the web shows it. Without this the validator answers in its own format, which
 * the web cannot read.
 */
export const validate = <Target extends "json" | "query", Schema extends ZodType>(target: Target, schema: Schema, errors: ModuleErrors) =>
  zValidator(target, schema, (result) => {
    if (!result.success) throw errors.badRequest(reasonOf(result.error.issues));
  });
