/**
 * Billing router — the owner's account, under `scope=account|organization`.
 *
 *   GET    /billing/summary?scope=            the plan and whether a customer exists
 *   GET    /billing/payments?scope=&page&pageSize every movement of real money
 *   GET    /billing/purchases?scope=&page&pageSize what the owner bought
 *   POST   /billing/checkout                  { scope, planKey | bundleKey } → { url }
 *   POST   /billing/portal                    { scope } → { url }
 *
 * Every route is a validated call into a service; the services prove access
 * through the engine. Checkout and the portal answer 503 while no payment
 * provider is configured.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { CheckoutRequestSchema, ListQuerySchema, ScopeRequestSchema, ScopeSchema } from "../models/payment.schemas";
import type { BillingService } from "../services/billing.service";
import type { PaymentAccountService } from "../services/payment-account.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { PaymentEnv } from "../types";
import { requireScopedAc } from "./route-helpers";

export interface CreateBillingRouterOptions {
  accounts: PaymentAccountService;
  billing: BillingService;
  errors: ModuleErrors;
}

const ScopeQuery = z.object({ scope: ScopeSchema });

export function createBillingRouter({ accounts, billing, errors }: CreateBillingRouterOptions) {
  return new Hono<PaymentEnv>()
    .get("/billing/summary", zValidator("query", ScopeQuery), async (c) => {
      const { scope } = c.req.valid("query");
      return c.json(await accounts.summary(requireScopedAc(c, errors), scope));
    })
    .get("/billing/payments", zValidator("query", ListQuerySchema), async (c) => {
      const { scope, page, pageSize } = c.req.valid("query");
      return c.json(await accounts.payments(requireScopedAc(c, errors), scope, { page, pageSize }));
    })
    .get("/billing/purchases", zValidator("query", ListQuerySchema), async (c) => {
      const { scope, page, pageSize } = c.req.valid("query");
      return c.json(await accounts.purchases(requireScopedAc(c, errors), scope, { page, pageSize }));
    })
    .post("/billing/checkout", zValidator("json", CheckoutRequestSchema), async (c) => {
      const { scope, ...item } = c.req.valid("json");
      return c.json(await billing.checkout(requireScopedAc(c, errors), scope, item));
    })
    .post("/billing/portal", zValidator("json", ScopeRequestSchema), async (c) => {
      const { scope } = c.req.valid("json");
      return c.json(await billing.portal(requireScopedAc(c, errors), scope));
    });
}
