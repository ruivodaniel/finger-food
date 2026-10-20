export const workflowIntentStatuses = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type WorkflowIntentStatus = (typeof workflowIntentStatuses)[number];

export const activeWorkflowIntentStatuses = [
  "pending",
  "processing",
] as const;

export type ActiveWorkflowIntentStatus = (typeof activeWorkflowIntentStatuses)[number];
