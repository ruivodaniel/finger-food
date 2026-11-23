import { DEFAULT_BACKOFF_BASE_MS, DEFAULT_MAX_ATTEMPTS } from "@libs/workflows";
import { describe, expect, it } from "vitest";
import { decideReclaimAction } from "@/workflow-intents/decide-reclaim-action";

const now = new Date("2026-07-30T12:00:00.000Z");
const NO_JITTER = () => 0.5; // multiplier = 1.0 (identity)

describe("decideReclaimAction", () => {
  it("reclaims a stale row while the attempt count is below the ceiling", () => {
    const action = decideReclaimAction(
      { id: "intent_1", attemptCount: 3 },
      { now, random: NO_JITTER },
    );

    expect(action.type).toBe("reclaim");
    if (action.type === "reclaim") {
      expect(action.availableAt.getTime()).toBeGreaterThan(now.getTime());
      expect(action.errorCode).toBe("dispatch_visibility_timeout");
    }
  });

  it("schedules the first retry 30s out", () => {
    // claim-intent increments attemptCount, so the first stale row the
    // reclaimer sees has attemptCount=1 → 30s * 2^0.
    const action = decideReclaimAction(
      { id: "intent_1", attemptCount: 1 },
      { now, random: NO_JITTER },
    );

    expect(action.type).toBe("reclaim");
    if (action.type === "reclaim") {
      expect(action.availableAt.getTime() - now.getTime()).toBe(
        DEFAULT_BACKOFF_BASE_MS,
      );
    }
  });

  it("doubles the delay on each subsequent attempt", () => {
    const action = decideReclaimAction(
      { id: "intent_1", attemptCount: 2 },
      { now, random: NO_JITTER },
    );

    expect(action.type).toBe("reclaim");
    if (action.type === "reclaim") {
      expect(action.availableAt.getTime() - now.getTime()).toBe(
        DEFAULT_BACKOFF_BASE_MS * 2,
      );
    }
  });

  it("gives up once the attempt count reaches maxAttempts", () => {
    expect(
      decideReclaimAction(
        { id: "intent_1", attemptCount: DEFAULT_MAX_ATTEMPTS },
        { now, random: NO_JITTER },
      ),
    ).toEqual({
      type: "fail",
      code: "max_retries_exceeded",
      safeMessage: "Workflow intent exceeded the retry budget",
    });
  });

  it("gives up when the attempt count overshoots the ceiling too", () => {
    expect(
      decideReclaimAction(
        { id: "intent_1", attemptCount: DEFAULT_MAX_ATTEMPTS + 5 },
        { now, random: NO_JITTER },
      ).type,
    ).toBe("fail");
  });

  it("honors a custom maxAttempts", () => {
    expect(
      decideReclaimAction(
        { id: "intent_1", attemptCount: 3 },
        { now, maxAttempts: 3, random: NO_JITTER },
      ).type,
    ).toBe("fail");
  });
});
