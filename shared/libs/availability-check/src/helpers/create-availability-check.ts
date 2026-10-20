// =============================================================================
// CREATE AVAILABILITY CHECK
// =============================================================================
//
// Factory that creates a lookup function for availability checks.
// Pure function — no React. Modules wrap this in a hook that provides
// memberRoles and config from their own context.
//
// =============================================================================

import type { AvailabilityResult, AvailabilityInput } from '../core/types';
import type { AvailabilityButtonProps } from './get-button-props';
import { resolveAvailability } from '../core/resolve';
import { formatReasons } from '../format/format-reason';
import { getButtonProps } from './get-button-props';

/** The result returned by the lookup function, with convenience accessors. */
export interface AvailabilityCheckResult extends AvailabilityResult {
  /** Ready-to-spread Button props: { disabled, disabledReason }. */
  buttonProps: AvailabilityButtonProps;
  /** Formatted human-readable reason string (joined). */
  disabledReason: string | undefined;
}

/**
 * Create a lookup function that resolves availability by config key.
 *
 * @param fromScope - A configured fromScope adapter (from createFromScope)
 * @param memberRoles - The user's effective roles for the active org
 * @param checks - The availability checks config (entity → action → role[])
 * @returns A function: `(key: "entity.action") → AvailabilityCheckResult`
 *
 * @example
 * ```ts
 * const check = createAvailabilityCheck(fromScope, memberRoles, checks);
 * check("organization.create").available     // boolean
 * check("organization.create").buttonProps   // { disabled, disabledReason }
 * check("member.invite").reasons             // Reason[]
 * ```
 */
export function createAvailabilityCheck(
  fromScope: (roles: string[], required: string[]) => AvailabilityInput,
  memberRoles: string[],
  checks: Record<string, Record<string, readonly string[]>>,
): (key: string) => AvailabilityCheckResult {
  // Cache results per key within this call (same roles + checks = same result)
  const cache = new Map<string, AvailabilityCheckResult>();

  return (key: string): AvailabilityCheckResult => {
    const cached = cache.get(key);
    if (cached) return cached;

    const [entity, action] = key.split(".");
    const requiredRoles = checks[entity]?.[action];

    if (!requiredRoles || requiredRoles.length === 0) {
      // No config for this key — allow by default (BE is authoritative)
      const result: AvailabilityCheckResult = {
        available: true,
        reasons: [],
        buttonProps: { disabled: false, disabledReason: undefined },
        disabledReason: undefined,
      };
      cache.set(key, result);
      return result;
    }

    const base = resolveAvailability([
      fromScope(memberRoles, [...requiredRoles]),
    ]);

    const result: AvailabilityCheckResult = {
      ...base,
      buttonProps: getButtonProps(base),
      disabledReason: !base.available
        ? formatReasons(base.reasons).join(". ")
        : undefined,
    };

    cache.set(key, result);
    return result;
  };
}
