import { describe, expect, it, vi } from "vitest";
import { claimIntent } from "@/workflow-intents/intent-lifecycle.repository";

function makeExecutor(returningRows: unknown[]) {
  const set = vi.fn();
  const returning = vi.fn(async () => returningRows);
  const update = vi.fn(() => ({
    set: (...args: unknown[]) => {
      set(...args);
      return { where: () => ({ returning }) };
    },
  }));
  return {
    executor: { update } as unknown as Parameters<typeof claimIntent>[0],
    set,
  };
}

const now = new Date("2026-07-30T12:00:00.000Z");

describe("claimIntent", () => {
  it("takes the claim in one statement and returns the claimed row", async () => {
    const row = { id: "intent_1", attemptCount: 1 };
    const { executor, set } = makeExecutor([row]);

    expect(
      await claimIntent(executor, {
        intentId: "intent_1",
        workerId: "host:1:boot",
        now,
      }),
    ).toBe(row);

    const payload = set.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      status: "processing",
      claimedAt: now,
      claimedBy: "host:1:boot",
    });
    // attemptCount is incremented in SQL, not read-then-written
    expect(payload.attemptCount).toBeDefined();
    expect(typeof payload.attemptCount).not.toBe("number");
  });

  it("returns null when the guard matched no row — the loser is a no-op", async () => {
    const { executor } = makeExecutor([]);

    expect(
      await claimIntent(executor, {
        intentId: "intent_1",
        workerId: "host:1:boot",
        now,
      }),
    ).toBeNull();
  });
});
