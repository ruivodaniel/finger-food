// =============================================================================
// The nudge's contract: it never throws into the caller's response path, and
// every non-triggered outcome is a visible log line — the reconciler is the
// safety net behind all of them.
// =============================================================================

import { workflowKinds } from "@libs/workflows";
import { describe, expect, it, vi } from "vitest";
import { dispatchAfterCommit } from "@/workflow-intents/dispatch-after-commit";

const handle = {
  intentId: "intent_1",
  kind: workflowKinds.notificationDispatch,
  shouldNudge: true,
};

function collectingLogger(): {
  warnings: Array<{ fields: Record<string, unknown>; message: string }>;
  warn: (fields: Record<string, unknown>, message: string) => void;
} {
  const warnings: Array<{ fields: Record<string, unknown>; message: string }> =
    [];
  return {
    warnings,
    warn: (fields, message) => warnings.push({ fields, message }),
  };
}

describe("dispatchAfterCommit", () => {
  it("skips silently when the handle asks for no nudge", async () => {
    const logger = collectingLogger();

    const result = await dispatchAfterCommit(
      { ...handle, shouldNudge: false },
      { logger, enqueueIntent: vi.fn() },
    );

    expect(result).toEqual({ status: "skipped" });
    expect(logger.warnings).toHaveLength(0);
  });

  it("skips with a queue_not_configured warning when no producer is wired", async () => {
    const logger = collectingLogger();

    const result = await dispatchAfterCommit(handle, { logger });

    expect(result).toEqual({ status: "skipped" });
    expect(logger.warnings).toHaveLength(1);
    expect(logger.warnings[0].fields).toMatchObject({
      intentId: "intent_1",
      errorCode: "queue_not_configured",
    });
  });

  it("reports triggered after a successful enqueue", async () => {
    const logger = collectingLogger();
    const enqueueIntent = vi.fn().mockResolvedValue(undefined);

    const result = await dispatchAfterCommit(handle, {
      logger,
      enqueueIntent,
    });

    expect(result).toEqual({ status: "triggered" });
    expect(enqueueIntent).toHaveBeenCalledWith({
      intentId: "intent_1",
      kind: workflowKinds.notificationDispatch,
    });
    expect(logger.warnings).toHaveLength(0);
  });

  it("absorbs a throwing producer into a sanitized failed warning", async () => {
    const logger = collectingLogger();
    const enqueueIntent = vi
      .fn()
      .mockRejectedValue(new Error("ECONNREFUSED redis 16379 secret-host"));

    const result = await dispatchAfterCommit(handle, {
      logger,
      enqueueIntent,
    });

    expect(result).toEqual({ status: "failed" });
    expect(logger.warnings).toHaveLength(1);
    // Sanitized: the fallback code, never the raw exception text.
    expect(logger.warnings[0].fields).toMatchObject({
      intentId: "intent_1",
      errorCode: "queue_nudge_failed",
    });
    expect(JSON.stringify(logger.warnings[0])).not.toContain("secret-host");
  });

  it("passes a thrown SafeError's code through", async () => {
    const logger = collectingLogger();
    const enqueueIntent = vi
      .fn()
      .mockRejectedValue({ code: "redis_down", safeMessage: "redis down" });

    const result = await dispatchAfterCommit(handle, {
      logger,
      enqueueIntent,
    });

    expect(result).toEqual({ status: "failed" });
    expect(logger.warnings[0].fields).toMatchObject({
      errorCode: "redis_down",
    });
  });
});
