/**
 * Passwords for the fixture demo users declared in `cast.ts`.
 *
 * COMMITTED on purpose — these are throwaway local-dev fixture accounts,
 * not real credentials. The dev environment seeds them. Re-imported on
 * every snapshot request, so edits take effect immediately.
 */

export const CAST_PASSWORDS: Record<string, string> = {
  daniel:  "Qwerty@123456",
  dorothy: "Qwerty@123456",
};
