import { describe, expect, it, vi } from "vitest";
import { failIntent } from "@/workflow-intents/intent-lifecycle.repository";

function makeExecutor(returningRows: Array<{ id: string }> = [{ id: "intent_1" }]) {
  const set = vi.fn();
  const where = vi.fn();
  const returning = vi.fn(async () => returningRows);
  const update = vi.fn(() => ({
    set: (...args: unknown[]) => {
      set(...args);
      return {
        where: (...whereArgs: unknown[]) => {
          where(...whereArgs);
          return { returning };
        },
      };
    },
  }));
  return {
    executor: { update } as unknown as Parameters<typeof failIntent>[0],
    set,
    where,
    returning,
  };
}

describe("failIntent", () => {
  it("writes sanitized fields and reports updated=true when the guard matches", async () => {
    const { executor, set, returning } = makeExecutor();

    const result = await failIntent(executor, {
      intentId: "intent_1",
      code: "processor_failure",
      safeMessage: "processor failed",
    });

    expect(result).toEqual({ updated: true });
    expect(returning).toHaveBeenCalledTimes(1);

    const payload = set.mock.calls[0]![0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      status: "failed",
      lastErrorCode: "processor_failure",
      lastErrorMessage: "processor failed",
    });
    expect(payload.completedAt).toBeInstanceOf(Date);
    expect(payload.updatedAt).toBeInstanceOf(Date);
  });

  it("reports updated=false when the status guard matches no row", async () => {
    const { executor } = makeExecutor([]);

    expect(
      await failIntent(executor, {
        intentId: "intent_1",
        code: "processor_failure",
        safeMessage: "processor failed",
      }),
    ).toEqual({ updated: false });
  });

  it("refuses a raw Error smuggled past the types", async () => {
    const { executor } = makeExecutor();

    const badInput = {
      intentId: "intent_1",
      error: new Error("smtp said mailbox ada@acme.test is over quota"),
    } as unknown as Parameters<typeof failIntent>[1];

    await expect(failIntent(executor, badInput)).rejects.toThrow();
  });

  it("refuses an empty code or message", async () => {
    const { executor } = makeExecutor();

    await expect(
      failIntent(executor, {
        intentId: "intent_1",
        code: "",
        safeMessage: "non-empty",
      }),
    ).rejects.toThrow();

    await expect(
      failIntent(executor, {
        intentId: "intent_1",
        code: "some_code",
        safeMessage: "",
      }),
    ).rejects.toThrow();
  });
});
