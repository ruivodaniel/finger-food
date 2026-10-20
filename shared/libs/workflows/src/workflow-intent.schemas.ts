import { z } from "zod";
import { notificationDispatchIntentSchema } from "./notification-dispatch/notification-dispatch-intent.schema";
import { smokeIntentSchema } from "./smoke/smoke-intent.schema";
import { workflowKinds, type WorkflowKind } from "./workflow-kinds";

export const workflowIntentPayloadSchemas = {
  [workflowKinds.smokeRun]: smokeIntentSchema,
  [workflowKinds.notificationDispatch]: notificationDispatchIntentSchema,
} as const satisfies Record<WorkflowKind, z.ZodTypeAny>;

type WorkflowIntentPayloadSchemaMap = typeof workflowIntentPayloadSchemas;

export type WorkflowIntentPayloadByKind = {
  [K in keyof WorkflowIntentPayloadSchemaMap]: z.infer<WorkflowIntentPayloadSchemaMap[K]>;
};

export type WorkflowIntentPayload<K extends WorkflowKind = WorkflowKind> =
  WorkflowIntentPayloadByKind[K];

const workflowKindSet = new Set<string>(Object.values(workflowKinds));

export function isWorkflowKind(value: string): value is WorkflowKind {
  return workflowKindSet.has(value);
}

export function assertWorkflowKind(value: string): WorkflowKind {
  if (!isWorkflowKind(value)) {
    throw new Error(`Unknown workflow kind: ${value}`);
  }

  return value;
}

export function getWorkflowIntentPayloadSchema<K extends WorkflowKind>(
  kind: K
): WorkflowIntentPayloadSchemaMap[K] {
  return workflowIntentPayloadSchemas[kind];
}

export function parseWorkflowIntentPayload<K extends WorkflowKind>(
  kind: K,
  payload: unknown
): WorkflowIntentPayload<K> {
  return getWorkflowIntentPayloadSchema(kind).parse(
    payload,
  ) as WorkflowIntentPayload<K>;
}
