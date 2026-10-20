// =============================================================================
// Delivery-events tests — provider webhooks map to status transitions, and a
// late receipt never regresses a row the recipient already acted on.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createCaptureDeliveryOutbox } from "../testing/fake-transports";
import { makeNotificationsStack } from "../testing/test-stack";
import { memberJoinedEmail } from "../testing/test-catalog";

const RECIPIENT = "user_1";

async function stackWithSentEmail() {
  const outbox = createCaptureDeliveryOutbox();
  const stack = makeNotificationsStack({ deliveryOutbox: outbox });
  await stack.queue.queueEmail({
    template: memberJoinedEmail,
    args: { accepterName: "Ada", orgName: "Acme" },
    to: [{ userId: RECIPIENT, email: "inviter@acme.test" }],
  });
  const deliveryId = outbox.enqueued[0]!.deliveryId;
  await stack.delivery.deliverPending(deliveryId);
  return { deliveryId, ...stack };
}

describe("recordProviderEvent", () => {
  let stack: Awaited<ReturnType<typeof stackWithSentEmail>>;
  beforeEach(async () => {
    stack = await stackWithSentEmail();
  });

  it("advances a sent row to delivered", async () => {
    await stack.deliveryEvents.recordProviderEvent(stack.deliveryId, {
      kind: "delivered",
    });

    const row = await stack.deliveryRepo.getById(stack.deliveryId);
    expect(row?.status).toBe("delivered");
    expect(row?.deliveredAt).toBeInstanceOf(Date);
  });

  it("does not walk a seen row back to delivered", async () => {
    await stack.deliveryRepo.updateStatus(stack.deliveryId, {
      status: "seen",
      seenAt: new Date(),
    });

    await stack.deliveryEvents.recordProviderEvent(stack.deliveryId, {
      kind: "delivered",
    });

    expect(await stack.deliveryRepo.getById(stack.deliveryId)).toMatchObject({
      status: "seen",
    });
  });

  it("fails the row on a bounce, with the provider detail kept", async () => {
    await stack.deliveryEvents.recordProviderEvent(stack.deliveryId, {
      kind: "bounced",
      detail: "mailbox_full",
    });

    expect(await stack.deliveryRepo.getById(stack.deliveryId)).toMatchObject({
      status: "failed",
      lastErrorCode: "bounce:mailbox_full",
    });
  });

  it("fails the row on a complaint", async () => {
    await stack.deliveryEvents.recordProviderEvent(stack.deliveryId, {
      kind: "complained",
    });

    expect(await stack.deliveryRepo.getById(stack.deliveryId)).toMatchObject({
      status: "failed",
      lastErrorCode: "complaint:unknown",
    });
  });
});
