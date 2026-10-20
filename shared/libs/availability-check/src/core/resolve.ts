// =============================================================================
// AVAILABILITY RESOLVER - Core Function
// =============================================================================
//
// The kernel: one function that merges condition results.
// Pure function. No side effects. No API calls.
//
// =============================================================================

import type { AvailabilityInput, AvailabilityResult, Reason } from './types';

/**
 * Resolve availability from multiple inputs.
 * 
 * Merges all inputs and returns a single result:
 * - If ALL inputs are available → available: true
 * - If ANY input is unavailable → available: false with ALL reasons
 * 
 * @param inputs - Array of availability inputs from adapters
 * @returns Combined availability result
 * 
 * @example
 * ```typescript
 * const result = resolveAvailability([
 *   fromScope(memberRoles, ['manage_org']),
 *   fromBoolean(!isSaving, { code: 'in_progress', source: 'ui_state', params: {} }),
 *   fromZod(formErrors),
 * ]);
 * 
 * if (!result.available) {
 *   console.log('Blocked by:', result.reasons);
 * }
 * ```
 */
export function resolveAvailability(inputs: AvailabilityInput[]): AvailabilityResult {
  const reasons: Reason[] = [];
  
  for (const input of inputs) {
    if (!input.available) {
      reasons.push(...input.reasons);
    }
  }
  
  return {
    available: reasons.length === 0,
    reasons,
  };
}


