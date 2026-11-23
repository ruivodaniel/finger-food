/**
 * Selling router — the active organization as a vendor.
 *
 *   GET    /selling/vendor              { hasAccount, chargesEnabled }, read from Stripe
 *   POST   /selling/onboarding          → { url } Stripe-hosted onboarding, started or continued
 *   POST   /selling/dashboard           → { url } the vendor's Express dashboard
 *   GET    /selling/sales?page&pageSize the vendor's purchases
 *   GET    /selling/buyers              everyone who bought from the vendor, once each
 *   GET    /selling/products            the vendor's products
 *   POST   /selling/products            { name, description?, unitAmount, currency, refundPolicy? }
 *   PATCH  /selling/products/:id        any of those, and `active`
 *   GET    /selling/credits             the vendor's own credits: issued, outstanding, per holder
 *   POST   /selling/purchases/:id/credit-refund   { amount } settle a sale in the vendor's credits
 *   POST   /selling/promotions          { owner, amount, expiresAt } the vendor's credits, no purchase behind them, to a buyer
 *
 * The services prove access through the engine; onboarding and the dashboard
 * answer 503 while no payment provider is configured. Vendor credits never
 * touch Stripe.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { CreditRefundSchema, ProductCreateSchema, ProductListQuerySchema, ProductUpdateSchema, PromotionSchema } from "../models/payment.schemas";
import type { SellingService } from "../services/selling.service";
import type { VendorCreditsService } from "../services/vendor-credits.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { PaymentEnv } from "../types";
import { requireScopedAc } from "./route-helpers";

export function createSellingRouter({ selling, vendorCredits, errors }: { selling: SellingService; vendorCredits: VendorCreditsService; errors: ModuleErrors }) {
  return new Hono<PaymentEnv>()
    .get("/selling/vendor", async (c) => c.json(await selling.status(requireScopedAc(c, errors))))
    .post("/selling/onboarding", async (c) => c.json(await selling.onboarding(requireScopedAc(c, errors))))
    .post("/selling/dashboard", async (c) => c.json(await selling.dashboard(requireScopedAc(c, errors))))
    .get("/selling/sales", zValidator("query", ProductListQuerySchema), async (c) => {
      const { page, pageSize } = c.req.valid("query");
      return c.json(await selling.sales(requireScopedAc(c, errors), { page, pageSize }));
    })
    .get("/selling/buyers", async (c) => c.json(await selling.buyers(requireScopedAc(c, errors))))
    .get("/selling/products", async (c) => c.json(await selling.products(requireScopedAc(c, errors))))
    .post("/selling/products", zValidator("json", ProductCreateSchema), async (c) => {
      return c.json(await selling.createProduct(requireScopedAc(c, errors), c.req.valid("json")), 201);
    })
    .patch("/selling/products/:id", zValidator("json", ProductUpdateSchema), async (c) => {
      return c.json(await selling.updateProduct(requireScopedAc(c, errors), c.req.param("id"), c.req.valid("json")));
    })
    .get("/selling/credits", async (c) => c.json(await vendorCredits.outstanding(requireScopedAc(c, errors))))
    .post("/selling/purchases/:id/credit-refund", zValidator("json", CreditRefundSchema), async (c) => {
      return c.json(await vendorCredits.creditRefund(requireScopedAc(c, errors), c.req.param("id"), c.req.valid("json")));
    })
    .post("/selling/promotions", zValidator("json", PromotionSchema), async (c) => {
      return c.json(await vendorCredits.promote(requireScopedAc(c, errors), c.req.valid("json")), 201);
    });
}
