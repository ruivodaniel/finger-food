/**
 * Enqueue a unit of durable work.
 *
 * The kind and its payload are validated against `@libs/workflows` before the
 * row is written, so an intent the worker could never parse never reaches the
 * table. Returns a dispatch handle — the caller nudges with it after commit.
 */

import {
  assertWorkflowKind,
  parseWorkflowIntentPayload,
  type WorkflowKind,
} from "@libs/workflows";
import {
  enqueueWorkflowIntent as repositoryEnqueueWorkflowIntent,
  type EnqueueWorkflowIntentInput,
  type EnqueueWorkflowIntentResult,
  type WorkflowIntentExecutor,
} from "./workflow-intents.repository";
import type { WorkflowIntentDispatchHandle } from "./dispatch-after-commit";

export interface EnqueueWorkflowIntentRequest<
  K extends WorkflowKind = WorkflowKind,
> {
  kind: K;
  payload: unknown;
  dedupeKey?: string | null;
  availableAt?: Date;
  shouldNudge?: boolean;
}

export interface WorkflowIntentsRepository {
  enqueueWorkflowIntent(
    executor: WorkflowIntentExecutor,
    input: EnqueueWorkflowIntentInput,
  ): Promise<EnqueueWorkflowIntentResult>;
}

export interface EnqueueWorkflowIntentServiceDeps {
  repository?: WorkflowIntentsRepository;
}

const defaultRepository: WorkflowIntentsRepository = {
  enqueueWorkflowIntent: repositoryEnqueueWorkflowIntent,
};

export async function enqueueWorkflowIntent(
  executor: WorkflowIntentExecutor,
  request: EnqueueWorkflowIntentRequest,
  deps: EnqueueWorkflowIntentServiceDeps = {},
): Promise<WorkflowIntentDispatchHandle> {
  const repository = deps.repository ?? defaultRepository;

  const kind = assertWorkflowKind(request.kind);
  const payload = parseWorkflowIntentPayload(kind, request.payload);

  const { row } = await repository.enqueueWorkflowIntent(executor, {
    kind,
    payload,
    dedupeKey: request.dedupeKey ?? null,
    availableAt: request.availableAt,
  });

  return {
    intentId: row.id,
    kind,
    shouldNudge: request.shouldNudge ?? true,
  };
}
