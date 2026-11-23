/**
 * Product repository — data access for `product`. No logic: who may see or
 * change a product is the access-control engine's to say, in the selling
 * service; the Marketplace's listing of active products is public catalog
 * data and reads here directly.
 */

import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { paymentProduct, type PaymentProductSelect } from "../models/product.model";
import type { RefundPolicy } from "../../shared/types";
import type { Executor } from "../shared/executor";

export interface ProductRow {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  unitAmount: number;
  currency: string;
  refundPolicy: RefundPolicy;
}

export interface ProductPatch {
  name?: string;
  description?: string | null;
  unitAmount?: number;
  currency?: string;
  refundPolicy?: RefundPolicy;
  active?: boolean;
}

export interface ProductPage {
  rows: PaymentProductSelect[];
  total: number;
}

export interface ProductRepository {
  insert(executor: Executor, row: ProductRow): Promise<PaymentProductSelect>;
  findById(executor: Executor, id: string): Promise<PaymentProductSelect | null>;
  patch(executor: Executor, id: string, patch: ProductPatch): Promise<PaymentProductSelect | null>;
  /** Active products of every vendor, newest first, optionally by name. */
  listActive(executor: Executor, query: { search?: string; page: number; pageSize: number }): Promise<ProductPage>;
}

export class DrizzleProductRepository implements ProductRepository {
  async insert(executor: Executor, row: ProductRow): Promise<PaymentProductSelect> {
    const now = new Date();
    const rows = await executor.insert(paymentProduct).values({ ...row, active: true, createdAt: now, updatedAt: now }).returning();
    return rows[0];
  }

  async findById(executor: Executor, id: string): Promise<PaymentProductSelect | null> {
    const rows = await executor.select().from(paymentProduct).where(eq(paymentProduct.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async patch(executor: Executor, id: string, patch: ProductPatch): Promise<PaymentProductSelect | null> {
    const rows = await executor
      .update(paymentProduct)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(paymentProduct.id, id))
      .returning();
    return rows[0] ?? null;
  }

  async listActive(executor: Executor, query: { search?: string; page: number; pageSize: number }): Promise<ProductPage> {
    const where = and(eq(paymentProduct.active, true), query.search ? ilike(paymentProduct.name, `%${query.search}%`) : undefined);
    const rows = await executor
      .select()
      .from(paymentProduct)
      .where(where)
      .orderBy(desc(paymentProduct.createdAt), desc(paymentProduct.id))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    const [{ total }] = await executor.select({ total: sql<number>`count(*)::int` }).from(paymentProduct).where(where);
    return { rows, total };
  }
}
