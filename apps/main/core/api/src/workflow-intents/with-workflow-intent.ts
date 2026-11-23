/**
 * `withWorkflowIntent` — run a mutation and enqueue the work it implies, in one
 * transaction, then nudge once the commit is real.
 *
 * This is the shape every durable side effect in the app takes: the intent is
 * built FROM the mutation's result, inside the same transaction, so there is no
 * window where the rows exist and the work doesn't (or the reverse).
 */

import type { WorkflowIntentPayload, WorkflowKind } from "@libs/workflows";
import {
  dispatchAfterCommit,
  type DispatchAfterCommitDeps,
  type DispatchAfterCommitLogger,
  type WorkflowIntentDispatchHandle,
} from "./dispatch-after-commit";
import { enqueueWorkflowIntent } from "./workflow-intents.service";
import type { WorkflowIntentExecutor } from "./workflow-intents.repository";

export interface WorkflowIntentEnqueueRequest<
  K extends WorkflowKind = WorkflowKind,
> {
  kind: K;
  payload: WorkflowIntentPayload<K>;
  dedupeKey?: string;
  availableAt?: Date;
  shouldNudge?: boolean;
}

export interface WithWorkflowIntentOptions<Tx, TResult, K extends WorkflowKind> {
  runInTransaction: <T>(callback: (tx: Tx) => Promise<T>) => Promise<T>;
  execute: (tx: Tx) => Promise<TResult>;
  buildIntent: (
    result: TResult,
  ) =>
    | WorkflowIntentEnqueueRequest<K>
    | WorkflowIntentEnqueueRequest<K>[]
    | Promise<
        WorkflowIntentEnqueueRequest<K> | WorkflowIntentEnqueueRequest<K>[]
      >;
  enqueueIntent?: (
    tx: Tx,
    input: WorkflowIntentEnqueueRequest<K>,
  ) => Promise<WorkflowIntentDispatchHandle>;
  dispatchAfterCommit?: (
    handle: WorkflowIntentDispatchHandle,
  ) => Promise<unknown>;
  /** The queue producer's nudge; absent = skipped, reconciler covers. */
  enqueueIntentJob?: DispatchAfterCommitDeps["enqueueIntent"];
  logger?: DispatchAfterCommitLogger;
}

export async function withWorkflowIntent<Tx, TResult, K extends WorkflowKind>(
  options: WithWorkflowIntentOptions<Tx, TResult, K>,
): Promise<{
  result: TResult;
  dispatchHandles: WorkflowIntentDispatchHandle[];
}> {
  const enqueueIntent =
    options.enqueueIntent ??
    ((tx: Tx, input: WorkflowIntentEnqueueRequest<K>) =>
      enqueueWorkflowIntent(tx as WorkflowIntentExecutor, input));
  const dispatch =
    options.dispatchAfterCommit ??
    ((handle: WorkflowIntentDispatchHandle) => {
      if (!options.logger) {
        throw new Error(
          "withWorkflowIntent needs a logger when dispatchAfterCommit is not provided",
        );
      }
      return dispatchAfterCommit(handle, {
        logger: options.logger,
        enqueueIntent: options.enqueueIntentJob,
      });
    });

  const { result, dispatchHandles } = await options.runInTransaction(
    async (tx) => {
      const result = await options.execute(tx);
      const intents = await options.buildIntent(result);
      const intentList = Array.isArray(intents) ? intents : [intents];
      const dispatchHandles: WorkflowIntentDispatchHandle[] = [];

      for (const intent of intentList) {
        dispatchHandles.push(
          await enqueueIntent(tx, {
            ...intent,
            shouldNudge: intent.shouldNudge ?? true,
          }),
        );
      }

      return { result, dispatchHandles };
    },
  );

  for (const handle of dispatchHandles) {
    await dispatch(handle);
  }

  return { result, dispatchHandles };
}
