/**
 * Delivery events — provider webhooks (bounces, complaints, delivery
 * receipts), mapped to status transitions by the module so an app's webhook
 * route never touches the table.
 *
 * The only rule that matters here is no-regress: a `delivered` receipt that
 * arrives after the recipient already opened the message must not walk the row
 * back from `seen`.
 */

import type { DeliveryRepository } from "../repositories/delivery.repository";

export type ProviderDeliveryEvent =
  | { kind: "delivered" }
  | { kind: "bounced"; detail?: string }
  | { kind: "complained"; detail?: string };

export interface DeliveryEventsServiceDeps {
  deliveryRepo: Pick<DeliveryRepository, "updateStatus">;
}

export class DeliveryEventsService {
  constructor(private readonly deps: DeliveryEventsServiceDeps) {}

  async recordProviderEvent(
    deliveryId: string,
    event: ProviderDeliveryEvent,
  ): Promise<void> {
    switch (event.kind) {
      case "delivered":
        await this.deps.deliveryRepo.updateStatus(deliveryId, {
          status: "delivered",
          deliveredAt: new Date(),
          onlyFromStatuses: ["pending", "sent"],
        });
        return;
      case "bounced":
        await this.deps.deliveryRepo.updateStatus(deliveryId, {
          status: "failed",
          lastErrorCode: `bounce:${event.detail ?? "unknown"}`,
        });
        return;
      case "complained":
        await this.deps.deliveryRepo.updateStatus(deliveryId, {
          status: "failed",
          lastErrorCode: `complaint:${event.detail ?? "unknown"}`,
        });
        return;
    }
  }
}
