/**
 * Workflow-intent repository — data access for `workflow_intent`.
 *
 * Every write takes an executor so the enqueue rides the caller's transaction:
 * the intent and the rows it is about commit together, or neither does.
 */

import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import {
  workflowIntent,
  type WorkflowIntentInsert,
  type WorkflowIntentSelect,
} from "./workflow-intent.model";
import type * as schema from "@/models";

type Schema = typeof schema;

export type WorkflowIntentExecutor =
  | NodePgDatabase<Schema>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | PgTransaction<any, Schema, any>;

export interface EnqueueWorkflowIntentInput {
  id?: string;
  kind: string;
  payload: unknown;
  dedupeKey?: string | null;
  availableAt?: Date;
}

export interface EnqueueWorkflowIntentResult {
  row: WorkflowIntentSelect;
  /** False when a live intent for this (kind, dedupeKey) already existed. */
  created: boolean;
}

export async function enqueueWorkflowIntent(
  executor: WorkflowIntentExecutor,
  input: EnqueueWorkflowIntentInput,
): Promise<EnqueueWorkflowIntentResult> {
  const id = input.id ?? createId();
  const dedupeKey = input.dedupeKey ?? null;

  const values: WorkflowIntentInsert = {
    id,
    kind: input.kind,
    payload: input.payload,
    dedupeKey,
    availableAt: input.availableAt ?? new Date(),
  };

  const inserted = await executor
    .insert(workflowIntent)
    .values(values)
    .onConflictDoNothing({
      target: [workflowIntent.kind, workflowIntent.dedupeKey],
      where: sql`dedupe_key is not null and status in ('pending', 'processing')`,
    })
    .returning();

  if (inserted[0]) return { row: inserted[0], created: true };

  if (dedupeKey === null) {
    throw new Error(
      "workflow_intent insert returned no row for a request with no dedupeKey",
    );
  }

  // The partial-unique index rejected the insert, so a live intent for this
  // (kind, dedupeKey) exists — hand that one back instead of a fresh row.
  const existing = await executor
    .select()
    .from(workflowIntent)
    .where(
      and(
        eq(workflowIntent.kind, input.kind),
        eq(workflowIntent.dedupeKey, dedupeKey),
        inArray(workflowIntent.status, ["pending", "processing"]),
      ),
    )
    .limit(1);

  if (!existing[0]) {
    throw new Error(
      "workflow_intent insert conflicted but no live row was found to return",
    );
  }

  return { row: existing[0], created: false };
}

export async function findWorkflowIntentById(
  executor: WorkflowIntentExecutor,
  intentId: string,
): Promise<WorkflowIntentSelect | null> {
  const rows = await executor
    .select()
    .from(workflowIntent)
    .where(eq(workflowIntent.id, intentId))
    .limit(1);

  return rows[0] ?? null;
}
