/**
 * Credits router — the owner's credits, under `scope=account|organization`.
 *
 *   GET    /credits/summary?scope=              the balance and what is held at vendors
 *   GET    /credits/lots?scope=&page&pageSize   the lots, newest first, with their expiry
 *   GET    /credits/ledger?scope=&page&pageSize every movement, newest first
 *   GET    /credits/me                          the caller's own allocation in the active organization
 *   GET    /credits/allowances                  the organization's rules, and whether the caller may create credits
 *   PUT    /credits/allowances/:userId          { credits, period, unspent, services?, createsCredits? }
 *   DELETE /credits/allowances/:userId
 *   PUT    /credits/allowance-for-all           the same body: every member without a rule of their own
 *   DELETE /credits/allowance-for-all
 *
 * Every route is a validated call into a service; the services prove access
 * through the engine.
 */

import { Hono } from "hono";
import { AllowanceUpsertSchema, ListQuerySchema, ScopeQuerySchema } from "../models/credits.schemas";
import type { CreditAccountService } from "../services/credit-account.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { CreditsEnv } from "../types";
import { requireScopedAc, validate } from "./route-helpers";

export function createCreditsRouter({ accounts, errors }: { accounts: CreditAccountService; errors: ModuleErrors }) {
  return new Hono<CreditsEnv>()
    .get("/credits/summary", validate("query", ScopeQuerySchema, errors), async (c) => {
      const { scope } = c.req.valid("query");
      return c.json(await accounts.summary(requireScopedAc(c, errors), scope));
    })
    .get("/credits/lots", validate("query", ListQuerySchema, errors), async (c) => {
      const { scope, page, pageSize } = c.req.valid("query");
      return c.json(await accounts.lots(requireScopedAc(c, errors), scope, { page, pageSize }));
    })
    .get("/credits/ledger", validate("query", ListQuerySchema, errors), async (c) => {
      const { scope, page, pageSize } = c.req.valid("query");
      return c.json(await accounts.ledger(requireScopedAc(c, errors), scope, { page, pageSize }));
    })
    .get("/credits/me", async (c) => {
      return c.json({ allowance: await accounts.myAllowance(requireScopedAc(c, errors)) });
    })
    .get("/credits/allowances", async (c) => {
      return c.json(await accounts.allowances(requireScopedAc(c, errors)));
    })
    .put("/credits/allowances/:userId", validate("json", AllowanceUpsertSchema, errors), async (c) => {
      return c.json(await accounts.setAllowance(requireScopedAc(c, errors), c.req.param("userId"), c.req.valid("json")));
    })
    .delete("/credits/allowances/:userId", async (c) => {
      return c.json({ removed: await accounts.clearAllowance(requireScopedAc(c, errors), c.req.param("userId")) });
    })
    .put("/credits/allowance-for-all", validate("json", AllowanceUpsertSchema, errors), async (c) => {
      return c.json(await accounts.setAllowance(requireScopedAc(c, errors), null, c.req.valid("json")));
    })
    .delete("/credits/allowance-for-all", async (c) => {
      return c.json({ removed: await accounts.clearAllowance(requireScopedAc(c, errors), null) });
    });
}
