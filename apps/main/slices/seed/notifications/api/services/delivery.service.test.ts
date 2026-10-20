// =============================================================================
// Delivery service tests — the single send path: render, transport result,
// the delivery-time preference re-check, and the guards that make a second
// claim harmless. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createCaptureDeliveryOutbox } from "../testing/fake-transports";
import { makeNotificationsStack } from "../testing/test-stack";
import { inviteAcceptedInApp, memberJoinedEmail } from "../testing/test-catalog";

const RECIPIENT = "user_inviter";
const ARGS = { accepterName: "Ada", orgName: "Acme" };

/** Queue without delivering — the capture outbox holds the work. */
function stackWithPendingEmail() {
  const outbox = createCaptureDeliveryOutbox();
  const stack = makeNotificationsStack({ deliveryOutbox: outbox });
  const queueEmail = () =>
    stack.queue.queueEmail({
      template: memberJoinedEmail,
      args: ARGS,
      to: [{ userId: RECIPIENT, email: "inviter@acme.test" }],
    });
  return { outbox, queueEmail, ...stack };
}

describe("deliverPending", () => {
  let stack: ReturnType<typeof stackWithPendingEmail>;
  let deliveryId: string;

  beforeEach(async () => {
    stack = stackWithPendingEmail();
    await stack.queueEmail();
    deliveryId = stack.outbox.enqueued[0]!.deliveryId;
  });

  it("renders from the catalog, sends, and marks the row sent", async () => {
    const result = await stack.delivery.deliverPending(deliveryId);

    expect(result).toEqual({ outcome: "sent" });
    expect(stack.email.sent).toEqual([
      {
        to: "inviter@acme.test",
        subject: "Ada joined Acme",
        text: "Ada joined Acme.",
        html: "<p>Ada joined Acme.</p>",
      },
    ]);
    const row = await stack.deliveryRepo.getById(deliveryId);
    expect(row).toMatchObject({ status: "sent", attemptCount: 1 });
    expect(row?.sentAt).toBeInstanceOf(Date);
  });

  it("records a transport failure on the row instead of throwing", async () => {
    stack.email.failWith = "smtp_send_failed";

    const result = await stack.delivery.deliverPending(deliveryId);

    expect(result).toEqual({ outcome: "failed", errorCode: "smtp_send_failed" });
    expect(await stack.deliveryRepo.getById(deliveryId)).toMatchObject({
      status: "failed",
      lastErrorCode: "smtp_send_failed",
      attemptCount: 1,
    });
  });

  it("is a no-op on a row that is no longer pending", async () => {
    await stack.delivery.deliverPending(deliveryId);
    const second = await stack.delivery.deliverPending(deliveryId);

    expect(second).toEqual({ outcome: "skipped" });
    expect(stack.email.sent).toHaveLength(1);
    expect(await stack.deliveryRepo.getById(deliveryId)).toMatchObject({
      attemptCount: 1,
    });
  });

  it("leaves a failed row alone on a fresh attempt", async () => {
    stack.email.failWith = "smtp_send_failed";
    await stack.delivery.deliverPending(deliveryId);
    stack.email.failWith = null;

    expect(await stack.delivery.deliverPending(deliveryId)).toEqual({
      outcome: "skipped",
    });
    expect(stack.email.sent).toHaveLength(0);
  });

  it("re-attempts a failed row when the caller is retrying", async () => {
    stack.email.failWith = "smtp_send_failed";
    await stack.delivery.deliverPending(deliveryId);
    stack.email.failWith = null;

    const retried = await stack.delivery.deliverPending(deliveryId, {
      retryFailed: true,
    });

    expect(retried).toEqual({ outcome: "sent" });
    expect(stack.email.sent).toHaveLength(1);
    expect(await stack.deliveryRepo.getById(deliveryId)).toMatchObject({
      status: "sent",
      attemptCount: 2,
    });
  });

  it("does not re-send a row a retry finds already sent", async () => {
    await stack.delivery.deliverPending(deliveryId);

    expect(
      await stack.delivery.deliverPending(deliveryId, { retryFailed: true }),
    ).toEqual({ outcome: "skipped" });
    expect(stack.email.sent).toHaveLength(1);
  });

  it("suppresses a recipient who opted out after queueing, keeping the queue-time snapshot", async () => {
    await stack.preferences.set(RECIPIENT, {
      messageType: "organization",
      channel: "email",
      enabled: false,
    });

    const result = await stack.delivery.deliverPending(deliveryId);

    expect(result).toEqual({ outcome: "suppressed" });
    expect(stack.email.sent).toHaveLength(0);
    const row = await stack.deliveryRepo.getById(deliveryId);
    expect(row?.status).toBe("suppressed_by_pref");
    // the audit shows the change: the row still carries the rule at queue time
    expect(row?.preferenceSnapshot).toMatchObject({
      enabled: true,
      source: "default",
    });
  });

  it("reports a delivery id that isn't there", async () => {
    expect(await stack.delivery.deliverPending("nope")).toEqual({
      outcome: "not_found",
    });
  });

  it("never touches an in-app row — the committed row is already the delivery", async () => {
    await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: RECIPIENT }],
    });
    const inApp = stack.deliveryRepo.deliveries.find(
      (row) => row.channel === "in_app",
    )!;

    expect(await stack.delivery.deliverPending(inApp.id)).toEqual({
      outcome: "skipped",
    });
    expect(inApp.status).toBe("delivered");
  });
});

describe("the inline outbox", () => {
  it("delivers right after the queue's transaction commits", async () => {
    // no outbox override — the module's inline fallback is what mounts by default
    const stack = makeNotificationsStack();

    const receipt = await stack.queue.queueEmail({
      template: memberJoinedEmail,
      args: ARGS,
      to: [{ userId: RECIPIENT, email: "inviter@acme.test" }],
    });

    expect(receipt.queued).toBe(1);
    expect(stack.email.sent).toHaveLength(1);
    expect(stack.deliveryRepo.deliveries[0]?.status).toBe("sent");
  });
});
