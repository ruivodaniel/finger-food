// Error constructors the app injects at mount time — the slice never hard-codes an HTTP error class.

export interface ModuleErrors {
  notFound: (message?: string) => Error;
  badRequest: (message?: string) => Error;
  /** nobody signed in */
  unauthorized: (message?: string) => Error;
  /** read, but not to be changed by this user */
  forbidden: (message?: string) => Error;
  /** the write came from a head that moved since: the client reloads */
  conflict: (message?: string) => Error;
}
