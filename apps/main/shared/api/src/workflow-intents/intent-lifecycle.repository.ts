/**
 * The workflow-intent lifecycle, row by row: claim, complete, fail, retry,
 * reclaim what went stale, list what is claimable. Every write is a guarded
 * UPDATE (a CAS on status), so running any of them twice is a no-op. Moved
 * from apps/workers when background work was folded into the api.
 */

import { nextAvailableAt, safeErrorSchema } from "@libs/workflows";
import { and, asc, eq, lt, lte, sql } from "drizzle-orm";
import { decideReclaimAction, type StaleIntentRow } from "./decide-reclaim-action";
import { workflowIntent, type WorkflowIntentSelect } from "./workflow-intent.model";
import type { WorkflowIntentExecutor } from "./workflow-intents.repository";

/** A row due for dispatch. The attempt travels with it. */
export interface ClaimableIntentRow {
  id: string;
  attemptCount: number;
}

export async function findClaimablePendingIntents(
  executor: WorkflowIntentExecutor,
  input: { now: Date; limit: number },
): Promise<ClaimableIntentRow[]> {
  return executor
    .select({ id: workflowIntent.id, attemptCount: workflowIntent.attemptCount })
    .from(workflowIntent)
    .where(and(eq(workflowIntent.status, "pending"), lte(workflowIntent.availableAt, input.now)))
    .orderBy(asc(workflowIntent.availableAt), asc(workflowIntent.id))
    .limit(input.limit);
}

export interface ClaimIntentInput {
  intentId: string;
  workerId: string;
  now?: Date;
}

export async function claimIntent(
  executor: WorkflowIntentExecutor,
  input: ClaimIntentInput,
): Promise<WorkflowIntentSelect | null> {
  const now = input.now ?? new Date();

  const claimed = await executor
    .update(workflowIntent)
    .set({
      status: "processing",
      claimedAt: now,
      claimedBy: input.workerId,
      attemptCount: sql`${workflowIntent.attemptCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(workflowIntent.id, input.intentId),
        eq(workflowIntent.status, "pending"),
        lte(workflowIntent.availableAt, now),
      ),
    )
    .returning();

  return claimed[0] ?? null;
}

export interface CompleteIntentInput {
  intentId: string;
}

export interface CompleteIntentResult {
  /** True when the guarded UPDATE actually flipped a row to completed. */
  updated: boolean;
}

export async function completeIntent(
  executor: WorkflowIntentExecutor,
  input: CompleteIntentInput,
): Promise<CompleteIntentResult> {
  const now = new Date();

  const updated = await executor
    .update(workflowIntent)
    .set({ status: "completed", completedAt: now, updatedAt: now })
    .where(
      and(
        eq(workflowIntent.id, input.intentId),
        eq(workflowIntent.status, "processing"),
      ),
    )
    .returning({ id: workflowIntent.id });

  return { updated: updated.length > 0 };
}

export interface FailIntentInput {
  intentId: string;
  code: string;
  safeMessage: string;
}

export interface FailIntentResult {
  /** True when the guarded UPDATE actually flipped a row to failed. */
  updated: boolean;
}

export async function failIntent(
  executor: WorkflowIntentExecutor,
  input: FailIntentInput,
): Promise<FailIntentResult> {
  const safe = safeErrorSchema.parse({
    code: input.code,
    safeMessage: input.safeMessage,
  });

  const now = new Date();

  const updated = await executor
    .update(workflowIntent)
    .set({
      status: "failed",
      lastErrorCode: safe.code,
      lastErrorMessage: safe.safeMessage,
      completedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(workflowIntent.id, input.intentId),
        eq(workflowIntent.status, "processing"),
      ),
    )
    .returning({ id: workflowIntent.id });

  return { updated: updated.length > 0 };
}

export interface RetryIntentInput {
  intentId: string;
  /** Already incremented for the attempt that just failed — pass it through. */
  attemptCount: number;
  code: string;
  safeMessage: string;
  now?: Date;
  /** Injectable 0..1 source for deterministic backoff jitter in tests. */
  random?: () => number;
}

export interface RetryIntentResult {
  /** True when the guarded UPDATE actually returned the row to the queue. */
  updated: boolean;
  /** When the row becomes claimable again. */
  availableAt: Date;
}

export async function retryIntent(
  executor: WorkflowIntentExecutor,
  input: RetryIntentInput,
): Promise<RetryIntentResult> {
  const safe = safeErrorSchema.parse({
    code: input.code,
    safeMessage: input.safeMessage,
  });

  const now = input.now ?? new Date();
  const availableAt = nextAvailableAt(now, input.attemptCount, {
    random: input.random,
  });

  const updated = await executor
    .update(workflowIntent)
    .set({
      status: "pending",
      availableAt,
      claimedAt: null,
      claimedBy: null,
      lastErrorCode: safe.code,
      lastErrorMessage: safe.safeMessage,
      updatedAt: now,
    })
    .where(
      and(
        eq(workflowIntent.id, input.intentId),
        eq(workflowIntent.status, "processing"),
      ),
    )
    .returning({ id: workflowIntent.id });

  return { updated: updated.length > 0, availableAt };
}

/** How long a claim is honored before the row is considered abandoned. */
export const DEFAULT_VISIBILITY_TIMEOUT_MS = 10 * 60 * 1000;

export interface ReclaimStaleIntentsInput {
  now?: Date;
  visibilityTimeoutMs?: number;
  maxAttempts?: number;
  limit?: number;
  /** Injectable 0..1 source for backoff jitter (tests). */
  random?: () => number;
}

export interface ReclaimStaleIntentsResult {
  reclaimed: number;
  failed: number;
}

export async function findStaleProcessingIntents(
  executor: WorkflowIntentExecutor,
  input: { now: Date; visibilityTimeoutMs: number; limit: number },
): Promise<StaleIntentRow[]> {
  const threshold = new Date(input.now.getTime() - input.visibilityTimeoutMs);

  return executor
    .select({
      id: workflowIntent.id,
      attemptCount: workflowIntent.attemptCount,
    })
    .from(workflowIntent)
    .where(
      and(
        eq(workflowIntent.status, "processing"),
        lt(workflowIntent.claimedAt, threshold),
      ),
    )
    .limit(input.limit);
}

export async function reclaimStaleIntents(
  executor: WorkflowIntentExecutor,
  input: ReclaimStaleIntentsInput = {},
): Promise<ReclaimStaleIntentsResult> {
  const now = input.now ?? new Date();
  const visibilityTimeoutMs =
    input.visibilityTimeoutMs ?? DEFAULT_VISIBILITY_TIMEOUT_MS;
  const limit = input.limit ?? 200;
  const threshold = new Date(now.getTime() - visibilityTimeoutMs);

  const stale = await findStaleProcessingIntents(executor, {
    now,
    visibilityTimeoutMs,
    limit,
  });

  let reclaimed = 0;
  let failed = 0;

  for (const row of stale) {
    const action = decideReclaimAction(row, {
      now,
      maxAttempts: input.maxAttempts,
      random: input.random,
    });

    if (action.type === "fail") {
      const updated = await executor
        .update(workflowIntent)
        .set({
          status: "failed",
          lastErrorCode: action.code,
          lastErrorMessage: action.safeMessage,
          completedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(workflowIntent.id, row.id),
            eq(workflowIntent.status, "processing"),
            lt(workflowIntent.claimedAt, threshold),
          ),
        )
        .returning({ id: workflowIntent.id });

      if (updated.length > 0) failed += 1;
      continue;
    }

    const updated = await executor
      .update(workflowIntent)
      .set({
        status: "pending",
        availableAt: action.availableAt,
        claimedAt: null,
        claimedBy: null,
        lastErrorCode: action.errorCode,
        updatedAt: now,
      })
      .where(
        and(
          eq(workflowIntent.id, row.id),
          eq(workflowIntent.status, "processing"),
          lt(workflowIntent.claimedAt, threshold),
        ),
      )
      .returning({ id: workflowIntent.id });

    if (updated.length > 0) reclaimed += 1;
  }

  return { reclaimed, failed };
}
