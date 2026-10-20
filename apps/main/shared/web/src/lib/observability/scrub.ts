const sensitiveKeyPattern =
  /(authorization|cookie|set-cookie|password|token|secret|api[_-]?key|session|request|response|body)/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const longIdentifierPattern =
  /\b(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[A-Za-z0-9_-]{24,})\b/gi;
const pathIdentifierPattern = /\/([0-9]+|[0-9a-f]{8}-[0-9a-f-]{27,}|[A-Za-z0-9_-]{16,})(?=\/|$|\?|#)/gi;

function scrubString(value: string): string {
  return value
    .replace(emailPattern, "[REDACTED_EMAIL]")
    .replace(pathIdentifierPattern, "/:id")
    .replace(longIdentifierPattern, "[REDACTED_ID]");
}

export function scrubTelemetryValue(value: unknown): unknown {
  if (typeof value === "string") return scrubString(value);
  if (Array.isArray(value)) return value.map((item) => scrubTelemetryValue(item));

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : scrubTelemetryValue(item),
      ]),
    );
  }

  return value;
}
