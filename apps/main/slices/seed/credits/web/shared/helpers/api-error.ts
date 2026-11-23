/** An http error from the app's client: carries the response status. */
export function isApiError(error: unknown): error is Error & { status: number } {
  return error instanceof Error && typeof (error as { status?: unknown }).status === "number";
}

/** The server declined to serve this caller: signed out (401) or preconditions unmet (428). A state, not a failure. */
export const isUnavailable = (error: unknown): boolean => isApiError(error) && (error.status === 401 || error.status === 428);

/** The caller may not see these credits (403) — a member without Manage Billing, for instance. */
export const isForbidden = (error: unknown): boolean => isApiError(error) && error.status === 403;

/** An http answer is the server's word: retrying cannot change it. */
export const notAState = (failureCount: number, error: unknown): boolean => !isApiError(error) && failureCount < 2;

export const messageOf = (error: unknown): string => (isApiError(error) ? error.message : "Something went wrong — please try again.");
