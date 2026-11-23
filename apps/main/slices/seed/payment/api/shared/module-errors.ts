// Error constructors and the log sink the app injects at mount time — the
// slice never hard-codes an HTTP error class or a logger. No 402 here: a
// refused charge is a verdict the consumer turns into its own response.

export interface ModuleErrors {
  notFound: (message?: string) => Error;
  badRequest: (message?: string) => Error;
  unauthorized: (message?: string) => Error;
  forbidden: (message?: string) => Error;
  internalError: (message?: string) => Error;
  /** 503 — the feature exists but its provider is not configured (no Stripe keys). */
  unavailable: (message?: string) => Error;
}

export interface ModuleLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}
