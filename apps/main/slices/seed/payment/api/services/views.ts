/**
 * Row → wire shape, for the marketplace's two tables and a vendor's buyers.
 * The account's own views (summary, payments) live beside their services.
 * Names come from the user-organization slice (`../shared/owner-names.ts`),
 * looked up once per list.
 */

import type { BuyerView, PaymentOwner, ProductView, PurchaseView } from "../../shared/types";
import type { PaymentProductSelect } from "../models/product.model";
import type { PurchaseWithBuyer } from "../repositories/purchase.repository";
import { lookUpNames, type People } from "../shared/owner-names";

const productView = (row: PaymentProductSelect, nameOf: (id: string) => string): ProductView => ({
  id: row.id,
  organizationId: row.organizationId,
  vendorName: nameOf(row.organizationId),
  name: row.name,
  description: row.description,
  unitAmount: row.unitAmount,
  currency: row.currency,
  refundPolicy: row.refundPolicy,
  active: row.active,
});

export async function toProductViews(people: People, rows: PaymentProductSelect[]): Promise<ProductView[]> {
  const nameOf = await lookUpNames(people, { organizationIds: rows.map((r) => r.organizationId) });
  return rows.map((row) => productView(row, nameOf));
}

export async function toBuyerViews(people: People, owners: PaymentOwner[]): Promise<BuyerView[]> {
  const nameOf = await lookUpNames(people, {
    organizationIds: owners.flatMap((o) => (o.organizationId ? [o.organizationId] : [])),
    userIds: owners.flatMap((o) => (o.userId ? [o.userId] : [])),
  });
  return owners.map((owner) => ({ owner, name: nameOf(owner.organizationId ?? owner.userId) }));
}

const buyerOf = (row: PurchaseWithBuyer): PaymentOwner =>
  row.buyerOrganizationId != null ? { organizationId: row.buyerOrganizationId } : { userId: row.buyerUserId as string };

export async function toPurchaseViews(people: People, rows: PurchaseWithBuyer[]): Promise<PurchaseView[]> {
  const nameOf = await lookUpNames(people, {
    organizationIds: rows.flatMap((r) => [r.sellerOrganizationId, ...(r.buyerOrganizationId ? [r.buyerOrganizationId] : [])]),
    userIds: rows.flatMap((r) => (r.buyerUserId ? [r.buyerUserId] : [])),
  });
  return rows.map((row) => {
    const buyer = buyerOf(row);
    return {
      id: row.id,
      buyer,
      buyerName: nameOf(buyer.organizationId ?? buyer.userId),
      sellerOrganizationId: row.sellerOrganizationId,
      sellerName: nameOf(row.sellerOrganizationId),
      productId: row.productId,
      productName: row.productName,
      quantity: row.quantity,
      paidWith: row.paidWith,
      amountTotal: row.amountTotal,
      currency: row.currency,
      applicationFeeAmount: row.applicationFeeAmount,
      refundedAmount: row.refundedAmount,
      refundedAt: row.refundedAt ? row.refundedAt.toISOString() : null,
      creditsRefunded: row.creditsRefunded,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
