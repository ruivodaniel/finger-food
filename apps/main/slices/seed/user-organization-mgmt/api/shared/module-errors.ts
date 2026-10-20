// Error constructors the app injects at mount time — the module never
// hard-codes an HTTP error class.

export interface ModuleErrors {
  notFound: (message?: string) => Error;
  badRequest: (message?: string) => Error;
  unauthorized: (message?: string) => Error;
  forbidden: (message?: string) => Error;
  internalError: (message?: string) => Error;
}

export interface ModuleLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}
