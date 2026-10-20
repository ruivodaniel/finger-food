import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  assertWorkflowKind,
  parseWorkflowIntentPayload,
  workflowIntentPayloadSchemas,
  workflowKinds,
} from "./index";

describe("workflow intent schemas", () => {
  it("parses the smoke payload for the smoke kind", () => {
    const payload = parseWorkflowIntentPayload(workflowKinds.smokeRun, {
      smokeId: "smoke_123",
    });

    expect(payload).toEqual({ smokeId: "smoke_123" });
  });

  it("rejects an unknown kind", () => {
    expect(() => assertWorkflowKind("not-real.kind")).toThrowError("Unknown workflow kind: not-real.kind");
  });

  it("rejects an invalid payload for a known kind", () => {
    expect(() =>
      parseWorkflowIntentPayload(workflowKinds.smokeRun, {
        smokeId: "",
      })
    ).toThrow(ZodError);
  });

  it("keeps the payload schema registry keyed by the public workflow kind constants", () => {
    expect(Object.keys(workflowIntentPayloadSchemas).sort()).toEqual(
      [workflowKinds.smokeRun, workflowKinds.notificationDispatch].sort(),
    );
  });

  it("parses the notification.dispatch payload (deliveryId only)", () => {
    const payload = parseWorkflowIntentPayload(
      workflowKinds.notificationDispatch,
      { deliveryId: "d_1" },
    );
    expect(payload).toEqual({ deliveryId: "d_1" });
  });
});
