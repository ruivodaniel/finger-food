export const workflowKinds = {
  smokeRun: "smoke.run",
  notificationDispatch: "notification.dispatch",
} as const;

export type WorkflowKind = (typeof workflowKinds)[keyof typeof workflowKinds];
