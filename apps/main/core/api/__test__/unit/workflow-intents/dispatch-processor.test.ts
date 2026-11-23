import type { DeliverPendingResult } from "@modules/notifications/api";
import { describe, expect, it, vi } from "vitest";
import { createNotificationDispatchProcessor } from "@/wiring/notifications/dispatch-processor";

const PAYLOAD = { deliveryId: "delivery_1" };

function processorReturning(result: DeliverPendingResult) {
  const deliverPending = vi.fn(async () => result);
  return {
    deliverPending,
    processor: createNotificationDispatchProcessor({ deliverPending }),
  };
}

const context = (attemptCount: number) => ({
  intentId: "intent_1",
  attemptCount,
});

describe("notification.dispatch processor", () => {
  it("completes when the module sent the message", async () => {
    const { processor, deliverPending } = processorReturning({
      outcome: "sent",
    });

    expect(await processor(PAYLOAD, context(1))).toEqual({
      type: "completed",
    });
    expect(deliverPending).toHaveBeenCalledWith("delivery_1", {
      retryFailed: false,
    });
  });

  it("lets a reclaimed attempt re-try a row the last attempt failed on", async () => {
    const { processor, deliverPending } = processorReturning({
      outcome: "sent",
    });

    await processor(PAYLOAD, context(2));

    expect(deliverPending).toHaveBeenCalledWith("delivery_1", {
      retryFailed: true,
    });
  });

  it("treats a late opt-out as a completed outcome, not a failure", async () => {
    const { processor } = processorReturning({ outcome: "suppressed" });

    expect(await processor(PAYLOAD, context(1))).toEqual({
      type: "completed",
      completionCode: "suppressed_by_pref",
    });
  });

  it("closes an intent whose row is already resolved as obsolete", async () => {
    const { processor } = processorReturning({ outcome: "skipped" });

    expect(await processor(PAYLOAD, context(1))).toEqual({
      type: "obsolete",
      completionCode: "already_resolved",
    });
  });

  it("closes an intent whose delivery row is gone as obsolete", async () => {
    const { processor } = processorReturning({ outcome: "not_found" });

    expect(await processor(PAYLOAD, context(1))).toEqual({
      type: "obsolete",
      completionCode: "delivery_missing",
    });
  });

  it("throws the transport's error code as a safe pair when delivery fails", async () => {
    const { processor } = processorReturning({
      outcome: "failed",
      errorCode: "smtp_send_failed",
    });

    await expect(processor(PAYLOAD, context(1))).rejects.toEqual({
      code: "smtp_send_failed",
      safeMessage: "notification delivery failed",
    });
  });

  it("still throws a usable code when the module reported none", async () => {
    const { processor } = processorReturning({ outcome: "failed" });

    await expect(processor(PAYLOAD, context(1))).rejects.toEqual({
      code: "delivery_failed",
      safeMessage: "notification delivery failed",
    });
  });
});
