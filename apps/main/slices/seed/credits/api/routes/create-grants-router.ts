/**
 * Credit grants router — the platform owner's admin grants.
 *
 *   GET    /admin/credit-grants?page&pageSize      the grants made so far, newest first
 *   GET    /admin/credit-grants/owners?search=     credit owners by name
 *   POST   /admin/credit-grants                    { owner, amount, expiresAt?, priority?, note? }
 *
 * Every route stands on the platform's grant permission; the caller acts with
 * the platform organization active.
 */

import { Hono } from "hono";
import { CreditGrantSchema, OwnerSearchQuerySchema, PageQuerySchema } from "../models/credits.schemas";
import type { CreditGrantsService } from "../services/credit-grants.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { CreditsEnv } from "../types";
import { requireScopedAc, validate } from "./route-helpers";

export function createGrantsRouter({ grants, errors }: { grants: CreditGrantsService; errors: ModuleErrors }) {
  return new Hono<CreditsEnv>()
    .get("/admin/credit-grants", validate("query", PageQuerySchema, errors), async (c) => {
      const { page, pageSize } = c.req.valid("query");
      return c.json(await grants.list(requireScopedAc(c, errors), { page, pageSize }));
    })
    .get("/admin/credit-grants/owners", validate("query", OwnerSearchQuerySchema, errors), async (c) => {
      return c.json({ rows: await grants.searchOwners(requireScopedAc(c, errors), c.req.valid("query").search) });
    })
    .post("/admin/credit-grants", validate("json", CreditGrantSchema, errors), async (c) => {
      return c.json(await grants.grant(requireScopedAc(c, errors), c.req.valid("json")), 201);
    });
}
