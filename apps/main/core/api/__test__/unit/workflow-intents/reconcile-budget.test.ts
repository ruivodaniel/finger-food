import { describe, expect, it } from "vitest";
import { calculatePendingDispatchLimit } from "@/workflow-intents/reconcile-budget";

describe("calculatePendingDispatchLimit", () => {
  it("spends one tick budget across reclaimed, failed, and dispatched work", () => {
    expect(
      calculatePendingDispatchLimit({
        batchCap: 200,
        reclaimedCount: 80,
        failedCount: 30,
      }),
    ).toBe(90);
  });

  it("dispatches nothing when reclaim already spent the tick", () => {
    expect(
      calculatePendingDispatchLimit({
        batchCap: 200,
        reclaimedCount: 180,
        failedCount: 20,
      }),
    ).toBe(0);
  });

  it("never returns a negative limit when reclaim overshoots the tick", () => {
    expect(
      calculatePendingDispatchLimit({
        batchCap: 200,
        reclaimedCount: 220,
        failedCount: 5,
      }),
    ).toBe(0);
  });
});
