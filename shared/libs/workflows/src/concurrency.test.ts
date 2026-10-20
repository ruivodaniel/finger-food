import { describe, expect, it } from "vitest";
import {
  workflowIntentJobId,
  workflowIntentWorkerId,
} from "./index";

describe("workflow concurrency helpers", () => {
  it("derives a queue job id from the intent id and attempt", () => {
    expect(workflowIntentJobId("intent_123", 0)).toBe(
      "wfi:intent_123:0",
    );
  });

  it("is stable for one attempt, so a nudge and a reconciler tick collapse", () => {
    expect(workflowIntentJobId("intent_123", 2)).toBe(
      workflowIntentJobId("intent_123", 2),
    );
  });

  it("mints a distinct id per attempt, so a reclaimed row can run again", () => {
    expect(workflowIntentJobId("intent_123", 0)).not.toBe(
      workflowIntentJobId("intent_123", 1),
    );
  });

  it("creates a process-unique worker identifier", () => {
    expect(
      workflowIntentWorkerId({
        hostname: "worker-host",
        pid: 321,
        bootId: "boot_123",
      }),
    ).toBe("worker-host:321:boot_123");
  });
});
