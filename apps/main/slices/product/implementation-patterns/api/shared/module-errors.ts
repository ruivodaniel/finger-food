// Error constructors the app injects at mount time — the slice never
// hard-codes an HTTP error class.

export interface ModuleErrors {
  notFound: (message?: string) => Error;
  badRequest: (message?: string) => Error;
  unauthorized: (message?: string) => Error;
  forbidden: (message?: string) => Error;
  /** the meteor is locked: nobody changes it until it is unlocked */
  conflict: (message?: string) => Error;
  internalError: (message?: string) => Error;
  /** 402 — the action was refused for its credits. */
  paymentRequired: (message?: string) => Error;
}

export interface ModuleLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}
