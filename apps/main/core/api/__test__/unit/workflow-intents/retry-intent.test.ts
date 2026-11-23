import { DEFAULT_BACKOFF_BASE_MS } from "@libs/workflows";
import { describe, expect, it, vi } from "vitest";
import { retryIntent } from "@/workflow-intents/intent-lifecycle.repository";

function makeExecutor(returningRows: Array<{ id: string }> = [{ id: "intent_1" }]) {
  const set = vi.fn();
  const returning = vi.fn(async () => returningRows);
  const update = vi.fn(() => ({
    set: (...args: unknown[]) => {
      set(...args);
      return { where: () => ({ returning }) };
    },
  }));
  return {
    executor: { update } as unknown as Parameters<typeof retryIntent>[0],
    set,
  };
}

const now = new Date("2026-07-30T12:00:00.000Z");
const NO_JITTER = () => 0.5; // multiplier = 1.0 (identity)

describe("retryIntent", () => {
  it("returns the row to the queue with the claim cleared and a reason recorded", async () => {
    const { executor, set } = makeExecutor();

    const result = await retryIntent(executor, {
      intentId: "intent_1",
      attemptCount: 1,
      code: "smtp_send_failed",
      safeMessage: "notification delivery failed",
      now,
      random: NO_JITTER,
    });

    expect(result.updated).toBe(true);
    expect(result.availableAt.getTime()).toBe(
      now.getTime() + DEFAULT_BACKOFF_BASE_MS,
    );
    expect(set.mock.calls[0]![0]).toEqual({
      status: "pending",
      availableAt: result.availableAt,
      claimedAt: null,
      claimedBy: null,
      lastErrorCode: "smtp_send_failed",
      lastErrorMessage: "notification delivery failed",
      updatedAt: now,
    });
  });

  it("spaces later attempts further out", async () => {
    const { executor } = makeExecutor();

    const result = await retryIntent(executor, {
      intentId: "intent_1",
      attemptCount: 3,
      code: "smtp_send_failed",
      safeMessage: "notification delivery failed",
      now,
      random: NO_JITTER,
    });

    expect(result.availableAt.getTime()).toBe(
      now.getTime() + DEFAULT_BACKOFF_BASE_MS * 4,
    );
  });

  it("reports updated=false when the status guard matches no row", async () => {
    const { executor } = makeExecutor([]);

    expect(
      (
        await retryIntent(executor, {
          intentId: "intent_1",
          attemptCount: 1,
          code: "smtp_send_failed",
          safeMessage: "notification delivery failed",
          now,
        })
      ).updated,
    ).toBe(false);
  });

  it("refuses a raw Error smuggled past the types", async () => {
    const { executor } = makeExecutor();

    const badInput = {
      intentId: "intent_1",
      attemptCount: 1,
      error: new Error("smtp said mailbox ada@acme.test is over quota"),
    } as unknown as Parameters<typeof retryIntent>[1];

    await expect(retryIntent(executor, badInput)).rejects.toThrow();
  });
});
