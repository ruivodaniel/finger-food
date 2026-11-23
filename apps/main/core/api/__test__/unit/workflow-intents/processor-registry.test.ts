import { workflowKinds, type WorkflowKind } from "@libs/workflows";
import { beforeEach, describe, expect, it } from "vitest";
import {
  getWorkflowProcessor,
  hasWorkflowProcessor,
  registerWorkflowProcessor,
  resetWorkflowProcessorRegistryForTesting,
  type WorkflowProcessor,
} from "@/workflow-intents/processor-registry";

const noOp: WorkflowProcessor<typeof workflowKinds.notificationDispatch> =
  async () => ({ type: "completed" });

describe("workflow processor registry", () => {
  beforeEach(() => {
    resetWorkflowProcessorRegistryForTesting();
  });

  it("reports unknown kinds as absent and throws when resolving them", () => {
    expect(hasWorkflowProcessor("never.registered")).toBe(false);
    expect(() =>
      getWorkflowProcessor("never.registered" as unknown as WorkflowKind),
    ).toThrow(/Unknown workflow kind/i);
  });

  it("registers a processor and exposes it by kind", () => {
    registerWorkflowProcessor(workflowKinds.notificationDispatch, noOp);

    expect(hasWorkflowProcessor(workflowKinds.notificationDispatch)).toBe(true);
    expect(getWorkflowProcessor(workflowKinds.notificationDispatch)).toBe(noOp);
  });

  it("refuses two processors for the same kind", () => {
    registerWorkflowProcessor(workflowKinds.notificationDispatch, noOp);

    expect(() =>
      registerWorkflowProcessor(workflowKinds.notificationDispatch, noOp),
    ).toThrow(/already registered/i);
  });
});
