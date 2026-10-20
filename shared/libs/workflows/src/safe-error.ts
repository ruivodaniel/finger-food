import { z } from "zod";

// Cap on `safeMessage` length — bounds DB writes to `last_error_message` and
// log payload size if a processor passes a very long sanitized string.
export const SAFE_ERROR_MESSAGE_MAX_LENGTH = 500;

export const safeErrorSchema = z.object({
  code: z.string().min(1),
  safeMessage: z.string().min(1).max(SAFE_ERROR_MESSAGE_MAX_LENGTH),
}).strict();

export type SafeError = z.infer<typeof safeErrorSchema>;

const DEFAULT_SAFE_ERROR: SafeError = {
  code: "internal_workflow_error",
  safeMessage: "Workflow execution failed",
};

export function sanitizeError(
  error: unknown,
  fallback: Partial<SafeError> = {}
): SafeError {
  const parsed = safeErrorSchema.safeParse(error);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    code: fallback.code ?? DEFAULT_SAFE_ERROR.code,
    safeMessage: fallback.safeMessage ?? DEFAULT_SAFE_ERROR.safeMessage,
  };
}
