/**
 * Request schemas — what the routes accept. Scope picks the credit owner:
 * `account` is the caller's own, `organization` the active organization.
 */
import { z } from "zod";
import { ALLOCATION_PERIODS, CREDIT_SCOPES, UNSPENT_MODES } from "../../shared/types";

export const ScopeSchema = z.enum(CREDIT_SCOPES);
export type Scope = z.infer<typeof ScopeSchema>;

export const ScopeQuerySchema = z.object({ scope: ScopeSchema });

export const ListQuerySchema = z.object({
  scope: ScopeSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQuery = z.infer<typeof ListQuerySchema>;

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const serviceList = z.array(z.string().regex(/^[a-z][a-z0-9_]*$/)).min(1).nullable().default(null);

export const AllowanceUpsertSchema = z
  .object({
    /** the amount each period */
    credits: z.number().int().positive(),
    period: z.enum(ALLOCATION_PERIODS),
    unspent: z.enum(UNSPENT_MODES),
    /** null: any service */
    services: serviceList,
    /** each period's credits are created on the organization; needs its own permission */
    createsCredits: z.boolean().default(false),
  })
  .strict();
export type AllowanceUpsert = z.infer<typeof AllowanceUpsertSchema>;

/** A platform owner's grant: an owner, an amount, the services it can pay for (none: everything), an expiry (none never expires), a priority (1 gift … 3 with top-ups), a note. */
export const CreditGrantSchema = z
  .object({
    owner: z.union([z.object({ organizationId: z.string().min(1) }).strict(), z.object({ userId: z.string().min(1) }).strict()]),
    amount: z.number().int().positive(),
    services: serviceList,
    expiresAt: z.coerce.date().nullable().default(null),
    priority: z.number().int().min(1).max(3).default(1),
    note: z.string().trim().max(200).optional(),
  })
  .strict();
export type CreditGrant = z.infer<typeof CreditGrantSchema>;

export const OwnerSearchQuerySchema = z.object({ search: z.string().trim().min(1).max(120) });
