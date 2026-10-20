const SAFE_LOG_FIELD_NAMES = new Set([
  "intentId",
  "kind",
  "status",
  "attemptCount",
  "availableAt",
  "claimedAt",
  "claimedBy",
  "completedAt",
  "createdAt",
  "updatedAt",
  "workerId",
  "errorCode",
  "lastErrorCode",
  "completionCode",
  "taskId",
  "runId",
  "queue",
  "jobId",
  "jobName",
  "workerName",
  "workerMode",
  // Row id of the work a processor was handed — traceability without content.
  "deliveryId",
  // Aggregate counters for reconciler/metrics telemetry. Numeric only —
  // see pickSafeLogFields's toSafeLogFieldValue gate.
  "reclaimedCount",
  "failedCount",
  "dispatchedCount",
  "pendingCount",
  "processingCount",
  "completedCount",
  "staleCount",
]);

export type SafeLogFieldValue = string | number | boolean | null | undefined;

function toSafeLogFieldValue(value: unknown): SafeLogFieldValue | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return undefined;
}

export function pickSafeLogFields(
  fields: Record<string, unknown>
): Record<string, SafeLogFieldValue> {
  const safeFields: Record<string, SafeLogFieldValue> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (!SAFE_LOG_FIELD_NAMES.has(key)) {
      continue;
    }

    const safeValue = toSafeLogFieldValue(value);

    if (safeValue === undefined && value !== undefined) {
      continue;
    }

    safeFields[key] = safeValue;
  }

  return safeFields;
}
