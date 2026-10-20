// =============================================================================
// Launcher tests — what each class of failure does to the row. Retryable
// failures go back to the queue with backoff; failures that can never succeed,
// and failures with no budget left, go terminal.
// =============================================================================

import {
  DEFAULT_MAX_ATTEMPTS,
  workflowKinds,
  type SafeError,
} from "@libs/workflows";
import { beforeEach, describe, expect, it } from "vitest";
import type { WorkflowIntentExecutor } from "@/workflow-intents/workflow-intents.repository";
import {
  registerWorkflowProcessor,
  resetWorkflowProcessorRegistryForTesting,
  type WorkflowProcessor,
} from "@/workflow-intents/processor-registry";
import { runWorkflowIntent } from "@/workflow-intents/run-workflow-intent";

interface ClaimedRow {
  id: string;
  kind: string;
  payload: unknown;
  attemptCount: number;
}

/**
 * A `workflow_intent` executor double. Every lifecycle helper issues the same
 * `update().set().where().returning()` chain, so the fake records each `set`
 * payload in order and answers from a script of `returning` rows.
 */
function makeExecutor(claimed: ClaimedRow | null) {
  const writes: Array<Record<string, unknown>> = [];
  // the claim answers with the row (or nothing); every later write reports a hit
  const returns: unknown[][] = [claimed ? [claimed] : []];

  const executor = {
    update: () => ({
      set: (values: Record<string, unknown>) => {
        writes.push(values);
        return {
          where: () => ({
            returning: async () => returns.shift() ?? [{ id: claimed?.id }],
          }),
        };
      },
    }),
  } as unknown as WorkflowIntentExecutor;

  return { executor, writes };
}

const throwingProcessor: WorkflowProcessor<
  typeof workflowKinds.notificationDispatch
> = async () => {
  const safe: SafeError = {
    code: "smtp_send_failed",
    safeMessage: "notification delivery failed",
  };
  throw safe;
};

const deps = (executor: WorkflowIntentExecutor) => ({
  db: executor,
  workerId: "host:1:boot",
});

const claimedRow = (attemptCount: number, overrides: Partial<ClaimedRow> = {}) => ({
  id: "intent_1",
  kind: workflowKinds.notificationDispatch as string,
  payload: { deliveryId: "delivery_1" },
  attemptCount,
  ...overrides,
});

describe("a processor failure with budget left", () => {
  beforeEach(() => {
    resetWorkflowProcessorRegistryForTesting();
    registerWorkflowProcessor(
      workflowKinds.notificationDispatch,
      throwingProcessor,
    );
  });

  it("returns the row to the queue with backoff instead of failing it", async () => {
    const { executor, writes } = makeExecutor(claimedRow(1));
    const before = Date.now();

    const outcome = await runWorkflowIntent(deps(executor), {
      intentId: "intent_1",
    });

    expect(outcome.type).toBe("retry_scheduled");
    const [, retryWrite] = writes;
    expect(retryWrite).toMatchObject({
      status: "pending",
      claimedAt: null,
      claimedBy: null,
      lastErrorCode: "smtp_send_failed",
      lastErrorMessage: "notification delivery failed",
    });
    expect((retryWrite!.availableAt as Date).getTime()).toBeGreaterThan(before);
  });

  it("counts the attempt that failed, not one past it, when spacing the retry", async () => {
    const { executor, writes } = makeExecutor(claimedRow(1));
    const now = Date.now();

    await runWorkflowIntent(deps(executor), { intentId: "intent_1" });

    // 30s base for attempt 1, ±10% jitter — a +1 anywhere would land near 60s
    const delay = (writes[1]!.availableAt as Date).getTime() - now;
    expect(delay).toBeGreaterThan(26_000);
    expect(delay).toBeLessThan(34_000);
  });

  it("never writes a terminal status", async () => {
    const { executor, writes } = makeExecutor(claimedRow(3));

    await runWorkflowIntent(deps(executor), { intentId: "intent_1" });

    expect(writes.map((write) => write.status)).not.toContain("failed");
  });
});

describe("a processor failure with the budget spent", () => {
  beforeEach(() => {
    resetWorkflowProcessorRegistryForTesting();
    registerWorkflowProcessor(
      workflowKinds.notificationDispatch,
      throwingProcessor,
    );
  });

  it("fails the row terminally at the ceiling", async () => {
    const { executor, writes } = makeExecutor(claimedRow(DEFAULT_MAX_ATTEMPTS));

    const outcome = await runWorkflowIntent(deps(executor), {
      intentId: "intent_1",
    });

    expect(outcome.type).toBe("failed_processor");
    expect(writes[1]).toMatchObject({
      status: "failed",
      lastErrorCode: "smtp_send_failed",
      lastErrorMessage: "notification delivery failed",
    });
    expect(writes[1]!.completedAt).toBeInstanceOf(Date);
  });

  it("honors a lowered ceiling", async () => {
    const { executor, writes } = makeExecutor(claimedRow(2));

    const outcome = await runWorkflowIntent(
      { ...deps(executor), maxAttempts: 2 },
      { intentId: "intent_1" },
    );

    expect(outcome.type).toBe("failed_processor");
    expect(writes[1]).toMatchObject({ status: "failed" });
  });
});

describe("failures that retrying can't fix", () => {
  beforeEach(() => {
    resetWorkflowProcessorRegistryForTesting();
  });

  it("fails an unknown kind terminally on the first attempt", async () => {
    const { executor, writes } = makeExecutor(
      claimedRow(1, { kind: "never.registered" }),
    );

    const outcome = await runWorkflowIntent(deps(executor), {
      intentId: "intent_1",
    });

    expect(outcome.type).toBe("failed_unknown_kind");
    expect(writes[1]).toMatchObject({
      status: "failed",
      lastErrorCode: "unknown_kind",
    });
  });

  it("fails a payload the schema rejects terminally on the first attempt", async () => {
    registerWorkflowProcessor(
      workflowKinds.notificationDispatch,
      throwingProcessor,
    );
    const { executor, writes } = makeExecutor(
      // extra fields are exactly what the strict schema exists to reject
      claimedRow(1, {
        payload: { deliveryId: "delivery_1", recipientEmail: "ada@acme.test" },
      }),
    );

    const outcome = await runWorkflowIntent(deps(executor), {
      intentId: "intent_1",
    });

    expect(outcome.type).toBe("failed_invalid_payload");
    expect(writes[1]).toMatchObject({
      status: "failed",
      lastErrorCode: "payload_schema_validation",
    });
  });
});

describe("the happy paths", () => {
  beforeEach(() => {
    resetWorkflowProcessorRegistryForTesting();
  });

  it("completes the row when the processor succeeds", async () => {
    registerWorkflowProcessor(workflowKinds.notificationDispatch, async () => ({
      type: "completed",
    }));
    const { executor, writes } = makeExecutor(claimedRow(1));

    expect(
      await runWorkflowIntent(deps(executor), { intentId: "intent_1" }),
    ).toEqual({ type: "completed", intentId: "intent_1" });
    expect(writes[1]).toMatchObject({ status: "completed" });
  });

  it("does nothing when the claim was lost", async () => {
    const { executor, writes } = makeExecutor(null);

    expect(
      await runWorkflowIntent(deps(executor), { intentId: "intent_1" }),
    ).toEqual({ type: "lost_claim", intentId: "intent_1" });
    // only the claim attempt itself
    expect(writes).toHaveLength(1);
  });
});
