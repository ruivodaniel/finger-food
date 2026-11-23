/** An error the app's http client threw for a non-2xx answer. */
export interface ApiError extends Error {
  status: number;
  body?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}
