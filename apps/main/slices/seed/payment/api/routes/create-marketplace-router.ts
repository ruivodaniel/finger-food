/**
 * Marketplace router — the buyer's side.
 *
 *   GET    /marketplace/products?search&page&pageSize   every active product of every vendor
 *   GET    /marketplace/products/:id                    one product, and whether its vendor can take payments
 *   POST   /marketplace/checkout                        { scope, productId, quantity?, paidWith? } → { url }
 *   POST   /marketplace/pay-with-credits                { scope, productId, quantity? } → { purchaseId }, paid in full with the vendor's credits
 *
 * The listing and the product are public catalog data for any signed-in
 * person. Checkout stands on the buyer's billing custody; anything else the
 * client sends (an amount, a fee) is dropped by the schema, never read.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { MarketplaceQuerySchema, PayWithCreditsSchema, PurchaseCheckoutSchema } from "../models/payment.schemas";
import type { MarketplaceService } from "../services/marketplace.service";
import type { ModuleErrors } from "../shared/module-errors";
import type { PaymentEnv } from "../types";
import { requireScopedAc } from "./route-helpers";

export function createMarketplaceRouter({ marketplace, errors }: { marketplace: MarketplaceService; errors: ModuleErrors }) {
  return new Hono<PaymentEnv>()
    .get("/marketplace/products", zValidator("query", MarketplaceQuerySchema), async (c) => {
      requireScopedAc(c, errors);
      return c.json(await marketplace.listing(c.req.valid("query")));
    })
    .get("/marketplace/products/:id", async (c) => {
      requireScopedAc(c, errors);
      return c.json(await marketplace.product(c.req.param("id")));
    })
    .post("/marketplace/checkout", zValidator("json", PurchaseCheckoutSchema), async (c) => {
      return c.json(await marketplace.checkout(requireScopedAc(c, errors), c.req.valid("json")));
    })
    .post("/marketplace/pay-with-credits", zValidator("json", PayWithCreditsSchema), async (c) => {
      return c.json(await marketplace.payWithCredits(requireScopedAc(c, errors), c.req.valid("json")), 201);
    });
}
