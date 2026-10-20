// =============================================================================
// Queue service tests — status at birth, preference suppression, supersede,
// idempotency, and the outbox handoff. Docker-free.
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createCaptureDeliveryOutbox } from "../testing/fake-transports";
import { makeNotificationsStack } from "../testing/test-stack";
import {
  inviteAcceptedInApp,
  memberJoinedEmail,
  securityAlertSms,
} from "../testing/test-catalog";
import { testLogger } from "../testing/in-memory-repos";

const INVITER = "user_inviter";
const ARGS = { accepterName: "Ada", orgName: "Acme" };

function stackWithCaptureOutbox() {
  const outbox = createCaptureDeliveryOutbox();
  return { outbox, ...makeNotificationsStack({ deliveryOutbox: outbox }) };
}

describe("queueInApp", () => {
  let stack: ReturnType<typeof stackWithCaptureOutbox>;
  beforeEach(() => {
    stack = stackWithCaptureOutbox();
  });

  it("writes the fact once and a delivery row born delivered", async () => {
    const receipt = await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: INVITER }],
    });

    expect(receipt).toMatchObject({ queued: 1, suppressedByPref: 0 });
    expect(stack.notificationRepo.notifications.size).toBe(1);
    const [row] = stack.deliveryRepo.deliveries;
    expect(row).toMatchObject({
      recipientUserId: INVITER,
      channel: "in_app",
      status: "delivered",
      template: "invitation_accepted",
    });
    expect(row?.deliveredAt).toBeInstanceOf(Date);
    // the committed row IS the delivery — nothing goes downstream
    expect(stack.outbox.enqueued).toHaveLength(0);
  });

  it("writes one row per recipient and collapses a repeated userId", async () => {
    const receipt = await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: "a" }, { userId: "b" }, { userId: "a" }],
    });
    expect(receipt.queued).toBe(2);
    expect(stack.deliveryRepo.deliveries).toHaveLength(2);
  });

  it("supersedes the recipient's active row for the same dedupeKey", async () => {
    const input = {
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: INVITER }],
      dedupeKey: "invitation-accepted:inv_1",
    };
    await stack.queue.queueInApp(input);
    await stack.queue.queueInApp(input);

    const statuses = stack.deliveryRepo.deliveries.map((row) => row.status);
    expect(statuses).toEqual(["superseded", "delivered"]);
    const page = await stack.inbox.list(INVITER, { limit: 20 });
    expect(page.items).toHaveLength(1);
  });

  it("records the preference verdict on the row it writes", async () => {
    await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: INVITER }],
    });
    expect(stack.deliveryRepo.deliveries[0]?.preferenceSnapshot).toEqual({
      messageType: "organization",
      channel: "in_app",
      enabled: true,
      source: "default",
    });
  });
});

describe("preference suppression", () => {
  it("suppresses an opted-out recipient and says so in the receipt", async () => {
    const stack = stackWithCaptureOutbox();
    await stack.preferences.set(INVITER, {
      messageType: "organization",
      channel: "in_app",
      enabled: false,
    });

    const receipt = await stack.queue.queueInApp({
      template: inviteAcceptedInApp,
      args: ARGS,
      to: [{ userId: INVITER }, { userId: "other" }],
    });

    expect(receipt).toMatchObject({ queued: 1, suppressedByPref: 1 });
    const suppressed = stack.deliveryRepo.deliveries.find(
      (row) => row.recipientUserId === INVITER,
    );
    expect(suppressed).toMatchObject({
      status: "suppressed_by_pref",
      preferenceSnapshot: {
        messageType: "organization",
        channel: "in_app",
        enabled: false,
        source: "user",
      },
    });
  });

  it("ignores a stored preference for a type users can't silence", async () => {
    const stack = stackWithCaptureOutbox();
    // Written directly: the service itself refuses to store this.
    await stack.preferenceRepo.upsert({
      userId: INVITER,
      messageType: "system",
      channel: "sms",
      enabled: false,
    });

    const receipt = await stack.queue.queueSms({
      template: securityAlertSms,
      args: { orgName: "Acme" },
      to: [{ userId: INVITER, phone: "+15551234567" }],
    });

    expect(receipt).toMatchObject({ queued: 1, suppressedByPref: 0 });
    expect(stack.deliveryRepo.deliveries[0]).toMatchObject({
      status: "pending",
      preferenceSnapshot: { enabled: true, source: "policy" },
    });
  });
});

describe("queueEmail", () => {
  let stack: ReturnType<typeof stackWithCaptureOutbox>;
  beforeEach(() => {
    stack = stackWithCaptureOutbox();
  });

  it("hands pending rows to the outbox inside the transaction, then nudges", async () => {
    const receipt = await stack.queue.queueEmail({
      template: memberJoinedEmail,
      args: ARGS,
      to: [{ userId: INVITER, email: "inviter@acme.test" }],
    });

    const [row] = stack.deliveryRepo.deliveries;
    expect(row).toMatchObject({
      status: "pending",
      channel: "email",
      address: "inviter@acme.test",
    });
    expect(receipt.queued).toBe(1);
    expect(stack.outbox.enqueued).toEqual([
      { deliveryId: row?.id, channel: "email", dedupeKey: null },
    ]);
    expect(stack.outbox.nudged).toEqual([{ deliveryId: row?.id }]);
  });

  it("sends nothing twice for the same dedupeKey", async () => {
    const input = {
      template: memberJoinedEmail,
      args: ARGS,
      to: [{ userId: INVITER, email: "inviter@acme.test" }],
      dedupeKey: "member-joined:m_1",
    };
    const first = await stack.queue.queueEmail(input);
    const second = await stack.queue.queueEmail(input);

    expect(first.queued).toBe(1);
    expect(second.queued).toBe(0);
    expect(stack.deliveryRepo.deliveries).toHaveLength(1);
    expect(stack.outbox.enqueued).toHaveLength(1);
  });

  it("fails a recipient with no address for the channel, and never enqueues it", async () => {
    const receipt = await stack.queue.queueEmail({
      template: memberJoinedEmail,
      args: ARGS,
      to: [{ userId: INVITER }],
    });

    expect(receipt).toMatchObject({ queued: 0, suppressedByPref: 0 });
    expect(stack.deliveryRepo.deliveries[0]).toMatchObject({
      status: "failed",
      lastErrorCode: "missing_address",
    });
    expect(stack.outbox.enqueued).toHaveLength(0);
  });

  it("swallows a failed nudge — the outbox reconciles, the caller doesn't care", async () => {
    const logged: string[] = [];
    const outbox = createCaptureDeliveryOutbox();
    outbox.nudgeFails = true;
    const stack = makeNotificationsStack({
      deliveryOutbox: outbox,
      logger: { ...testLogger, error: (message) => logged.push(message) },
    });

    await expect(
      stack.queue.queueEmail({
        template: memberJoinedEmail,
        args: ARGS,
        to: [{ userId: INVITER, email: "inviter@acme.test" }],
      }),
    ).resolves.toMatchObject({ queued: 1 });
    expect(logged).toContain("notification outbox nudge failed");
    expect(stack.deliveryRepo.deliveries[0]?.status).toBe("pending");
  });
});

describe("catalog guards", () => {
  it("refuses a template that belongs to another channel", async () => {
    const stack = stackWithCaptureOutbox();
    await expect(
      stack.queue.queueSms({
        // the compiler stops this too — the guard is for wiring and js callers
        template: memberJoinedEmail as never,
        args: ARGS,
        to: [{ userId: INVITER, phone: "+15551234567" }],
      }),
    ).rejects.toThrow(/is a email template, not sms/);
  });

  it("refuses a template that was never mounted", async () => {
    const stack = stackWithCaptureOutbox();
    await expect(
      stack.queue.queueInApp({
        template: { ...inviteAcceptedInApp, name: "ghost" },
        args: ARGS,
        to: [{ userId: INVITER }],
      }),
    ).rejects.toThrow(/no in_app template named "ghost"/);
  });
});
