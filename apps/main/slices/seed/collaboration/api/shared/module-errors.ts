/** The errors the app hands the slice at mount: the slice says what went wrong, the app says what it looks like. */
export interface ModuleErrors {
  notFound: (message?: string) => Error;
  badRequest: (message?: string) => Error;
  /** nobody signed in */
  unauthorized: (message?: string) => Error;
  /** the app's rules refuse it */
  forbidden: (message?: string) => Error;
  conflict: (message?: string) => Error;
  /** What the document's owner refuses. */
  unprocessable: (message?: string) => Error;
}
