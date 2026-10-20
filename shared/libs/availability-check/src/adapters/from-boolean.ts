// =============================================================================
// FROM BOOLEAN ADAPTER
// =============================================================================
//
// The most flexible adapter: any boolean condition with a reason.
// Use for UI state, business rules, or any simple check.
//
// =============================================================================

import type { AvailabilityInput, Reason } from '../core/types';

/**
 * Create availability input from a boolean condition.
 * 
 * If condition is true → available
 * If condition is false → unavailable with the provided reason
 * 
 * @param condition - The boolean condition to check
 * @param reasonIfFalse - The reason to include if condition is false
 * @returns AvailabilityInput
 * 
 * @example Loading state
 * ```typescript
 * fromBoolean(!isLoading, { 
 *   code: 'in_progress', 
 *   source: 'ui_state', 
 *   params: { operation: 'loading' } 
 * })
 * ```
 * 
 * @example Saving state
 * ```typescript
 * fromBoolean(!isSaving, { 
 *   code: 'in_progress', 
 *   source: 'ui_state', 
 *   params: { operation: 'saving' } 
 * })
 * ```
 * 
 * @example Precondition (org selected)
 * ```typescript
 * fromBoolean(!!activeOrgId, { 
 *   code: 'precondition_missing', 
 *   source: 'ui_state', 
 *   params: { missing: 'organization' } 
 * })
 * ```
 * 
 * @example State conflict (archived)
 * ```typescript
 * fromBoolean(!org.isArchived, { 
 *   code: 'conflict', 
 *   source: 'business_rule', 
 *   params: { state: 'archived' } 
 * })
 * ```
 */
export function fromBoolean(
  condition: boolean,
  reasonIfFalse: Reason
): AvailabilityInput {
  if (condition) {
    return { available: true, reasons: [] };
  }
  
  return {
    available: false,
    reasons: [reasonIfFalse],
  };
}


