// =============================================================================
// FROM SCOPE ADAPTER
// =============================================================================
//
// Factory that creates an adapter wrapping a simple "any required role
// present in the member's effective roles" check. The agnostic v2 of
// @prowd/scoped-ac no longer ships a `checkAccess` helper, so this
// adapter implements the same contract inline against the consumer's
// role definitions (which carry the `.title` used for human-readable
// reasons).
//
// =============================================================================

import type { AvailabilityInput } from '../core/types';

/**
 * Minimal shape we need from a role definition: just the optional UI title.
 * Permissive on purpose so consumers can pass either the lib's
 * `ScopedRoleDefinitions` or their richer `ProductRoleDefinitions`.
 */
export interface FromScopeRoleDefinitions {
  [roleName: string]: { title?: string } | undefined;
}

/**
 * Create a configured fromScope adapter.
 *
 * Factory pattern: configure once at app initialization, use everywhere
 * without passing scopedRoles each time.
 *
 * @param scopedRoles - The scoped role definitions from your config
 * @returns A function that checks access and returns AvailabilityInput
 *
 * @example Setup (once, at app initialization)
 * ```typescript
 * // lib/availability.ts
 * import { createFromScope } from '@libs/availability-check';
 * import { roles } from '@configs/access-control';
 *
 * export const fromScope = createFromScope(roles);
 * ```
 *
 * @example Usage (many times, in components)
 * ```typescript
 * import { fromScope } from '@/lib/availability';
 *
 * const input = fromScope(memberRoles, ['manage_org']);
 * ```
 */
export function createFromScope(
  scopedRoles: FromScopeRoleDefinitions
): (memberRoles: string[], requiredRoles: string[]) => AvailabilityInput {
  /**
   * Check if member has any of the required roles.
   *
   * Synchronous — uses data already in session. No API calls.
   *
   * @param memberRoles - The member's effective roles (from session/middleware)
   * @param requiredRoles - Roles needed for this action (ANY of these)
   * @returns AvailabilityInput
   */
  return (memberRoles: string[], requiredRoles: string[]): AvailabilityInput => {
    if (requiredRoles.length === 0) {
      return { available: true, reasons: [] };
    }

    const matchedRole = requiredRoles.find((r) => memberRoles.includes(r));

    if (matchedRole !== undefined) {
      return { available: true, reasons: [] };
    }

    return {
      available: false,
      reasons: [{
        code: 'not_authorized',
        source: 'scope',
        params: {
          required: requiredRoles.map((r) => scopedRoles[r]?.title ?? r),
          missing: requiredRoles.map((r) => scopedRoles[r]?.title ?? r),
          reason: `You need one of: ${requiredRoles.join(", ")}`,
        },
      }],
    };
  };
}
