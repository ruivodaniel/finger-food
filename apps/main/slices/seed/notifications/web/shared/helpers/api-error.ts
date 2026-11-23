/** An error the app's http client threw for a non-2xx answer. */
export interface ApiError extends Error {
  status: number;
  body?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}

/**
 * True when the server declined to serve this caller rather than failing:
 * 401 (no session) or 428 (the app has preconditions this caller hasn't met).
 *
 * Both mean the same thing to a notification surface — there is nothing to
 * show, and asking again won't help until something outside this module
 * changes. The module doesn't interpret WHY; whoever owns those preconditions
 * owns the screen that clears them.
 */
export function isUnavailable(error: unknown): boolean {
  return isApiError(error) && (error.status === 401 || error.status === 428);
}
