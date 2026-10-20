/**
 * The queue job id for one ATTEMPT at an intent.
 *
 * The attempt is part of the id because a queue job id dedupes: while a job
 * with this id exists in the queue, a repeat enqueue is a no-op. An id built
 * from the intent id alone could pin a row to a retained finished job; naming
 * the attempt makes every re-dispatch necessarily fresh — a claim increments
 * `attempt_count` first.
 *
 * Ids still earn their place at this granularity — an api nudge and a
 * reconciler tick for the SAME attempt collapse to one job, which is the
 * duplicate that happens routinely. Everything stronger is the row's CAS
 * claim's job, not the queue's.
 */
export function workflowIntentJobId(
  intentId: string,
  attemptCount: number,
): string {
  return `wfi:${intentId}:${attemptCount}`;
}

export function workflowIntentWorkerId(input: {
  hostname: string;
  pid: number;
  bootId: string;
}): string {
  return `${input.hostname}:${input.pid}:${input.bootId}`;
}
