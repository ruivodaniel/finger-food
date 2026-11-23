/**
 * The envelope: what a run always returns. Success or failure is never an
 * output; the output is the data product inside a successful envelope.
 */

export type ErrorCode =
  | "input_invalid"
  | "input_too_large"
  | "format_not_accepted"
  | "ref_not_found"
  | "config_invalid"
  | "worker_failed"
  | "output_invalid"
  | "pipeline_failed";

export interface RunError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export type Envelope<O = Record<string, unknown>> =
  | { status: "ok"; output: O }
  | { status: "error"; error: RunError };

/** A thrown envelope error: a worker or pipeline step that failed with a typed reason. */
export class EnvelopeError extends Error {
  readonly error: RunError;
  constructor(error: RunError) {
    super(error.message);
    this.name = "EnvelopeError";
    this.error = error;
  }
}

/** Any thrown value → a RunError. EnvelopeError keeps its code; the rest is worker_failed. */
export function toRunError(err: unknown, fallback: ErrorCode = "worker_failed"): RunError {
  if (err instanceof EnvelopeError) return err.error;
  const message = err instanceof Error ? err.message : String(err);
  return { code: fallback, message, retryable: false };
}
