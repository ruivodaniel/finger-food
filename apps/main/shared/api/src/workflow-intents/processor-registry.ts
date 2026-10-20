/**
 * Kind → processor. The launcher task resolves work through this map, so
 * adding a workflow means adding a processor file, not touching the launcher.
 *
 * A kind with no processor is a failure, not a silent skip: the intent goes
 * terminal with `unknown_kind` instead of sitting claimable forever.
 */

import {
  assertWorkflowKind,
  type WorkflowIntentPayload,
  type WorkflowKind,
} from "@libs/workflows";

export interface WorkflowProcessorContext {
  intentId: string;
  /** Already incremented for THIS attempt — 1 means first try. */
  attemptCount: number;
}

export type WorkflowProcessor<K extends WorkflowKind = WorkflowKind> = (
  payload: WorkflowIntentPayload<K>,
  context: WorkflowProcessorContext,
) => Promise<WorkflowProcessorResult>;

export type WorkflowProcessorResult =
  | { type: "completed"; completionCode?: string }
  /** The work no longer applies (already resolved elsewhere) — not an error. */
  | { type: "obsolete"; completionCode: string };

/** A processor of some kind; the caller validated the payload for that kind. */
export type AnyWorkflowProcessor = (
  payload: never,
  context: WorkflowProcessorContext,
) => Promise<WorkflowProcessorResult>;

const registry = new Map<WorkflowKind, AnyWorkflowProcessor>();

export function registerWorkflowProcessor<K extends WorkflowKind>(
  kind: K,
  processor: WorkflowProcessor<K>,
): void {
  assertWorkflowKind(kind);

  if (registry.has(kind)) {
    throw new Error(
      `A workflow processor for kind "${kind}" is already registered`,
    );
  }

  registry.set(kind, processor);
}

export function hasWorkflowProcessor(kind: string): boolean {
  return registry.has(kind as WorkflowKind);
}

export function getWorkflowProcessor(kind: WorkflowKind): AnyWorkflowProcessor {
  const processor = registry.get(kind);

  if (!processor) {
    throw new Error(`Unknown workflow kind "${kind}" — no processor registered`);
  }

  return processor;
}

/** Visible only to tests. Not part of the production contract. */
export function resetWorkflowProcessorRegistryForTesting(): void {
  registry.clear();
}
