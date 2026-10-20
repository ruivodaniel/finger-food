/**
 * Password-policy check against a resolved FactorSpec's config — the ONE
 * authority on password acceptability. The provider's own judgment calls are
 * pinned off in its config; what remains there are hard floors this check
 * subsumes (min length ≥ 8 via the config validator, bcrypt's 72-byte max
 * below). Shared so the form validates with exactly the function the auth service
 * enforces with.
 *
 * Pure: returns the unmet requirements as human-readable fragments (empty =
 * compliant); the caller decides how to fail.
 */

import type { FactorConfig } from "./types";

/** bcrypt truncates beyond 72 bytes — the provider's non-negotiable ceiling. */
const MAX_PASSWORD_BYTES = 72;

export function passwordPolicyProblems(
  config: FactorConfig | undefined,
  password: string,
): string[] {
  if (!config) return [];
  const problems: string[] = [];
  if (password.length < config.minLength) {
    problems.push(`at least ${config.minLength} characters`);
  }
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    problems.push("an uppercase letter");
  }
  if (config.requireNumber && !/\d/.test(password)) {
    problems.push("a number");
  }
  if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
    problems.push(`at most ${MAX_PASSWORD_BYTES} bytes`);
  }
  return problems;
}
