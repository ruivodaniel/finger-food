/**
 * Request schemas — what the routes accept. Scope picks the billing owner:
 * `account` is the caller's own, `organization` the active organization.
 */
import { z } from "zod";
import { BILLING_SCOPES, REFUND_POLICIES } from "../../shared/types";

export const ScopeSchema = z.enum(BILLING_SCOPES);
export type Scope = z.infer<typeof ScopeSchema>;

const key = z.string().regex(/^[a-z][a-z0-9_]*$/);

/** A plan OR a bundle, never both. */
export const CheckoutRequestSchema = z.union([
  z.object({ scope: ScopeSchema, planKey: key }).strict(),
  z.object({ scope: ScopeSchema, bundleKey: key }).strict(),
]);
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export const ScopeRequestSchema = z.object({ scope: ScopeSchema }).strict();
export type ScopeRequest = z.infer<typeof ScopeRequestSchema>;

export const ListQuerySchema = z.object({
  scope: ScopeSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

const currency = z.string().regex(/^[a-z]{3}$/);

export const ProductCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    unitAmount: z.number().int().positive(),
    currency,
    refundPolicy: z.enum(REFUND_POLICIES).default("money"),
  })
  .strict();
export type ProductCreate = z.infer<typeof ProductCreateSchema>;

export const ProductUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    unitAmount: z.number().int().positive().optional(),
    currency: currency.optional(),
    refundPolicy: z.enum(REFUND_POLICIES).optional(),
    active: z.boolean().optional(),
  })
  .strict();
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

/**
 * A buy by card. Not strict on purpose: anything else the client sends (an
 * amount, a fee) is dropped, never read — the price is the product's. How it
 * is paid is declared and checked: `card` is the only value. Paying with the
 * vendor's credits has its own route and its own body, and a payment split
 * between the two, or in platform credits, has no way to be said.
 */
export const PurchaseCheckoutSchema = z.object({
  scope: ScopeSchema,
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(100).default(1),
  paidWith: z.enum(["card"]).default("card"),
});
export type PurchaseCheckout = z.infer<typeof PurchaseCheckoutSchema>;

/** A buy paid in full with the credits the buyer holds at the product's vendor. Strict: there is nothing else to say. */
export const PayWithCreditsSchema = z
  .object({
    scope: ScopeSchema,
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(100).default(1),
  })
  .strict();
export type PayWithCredits = z.infer<typeof PayWithCreditsSchema>;

/** A vendor settles part or all of a purchase in its own credits; the amount in cents. */
export const CreditRefundSchema = z.object({ amount: z.number().int().positive() }).strict();
export type CreditRefund = z.infer<typeof CreditRefundSchema>;

/** A vendor gives a billing owner its own credits with no purchase behind them. */
export const PromotionSchema = z
  .object({
    owner: z.union([z.object({ organizationId: z.string().min(1) }).strict(), z.object({ userId: z.string().min(1) }).strict()]),
    amount: z.number().int().positive(),
    expiresAt: z.coerce.date(),
  })
  .strict();
export type Promotion = z.infer<typeof PromotionSchema>;

export const ProductListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const MarketplaceQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type MarketplaceQuery = z.infer<typeof MarketplaceQuerySchema>;
