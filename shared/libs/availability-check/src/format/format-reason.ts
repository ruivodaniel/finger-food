// =============================================================================
// FORMAT REASONS
// =============================================================================
//
// Convert reasons to human-readable strings.
// Uses i18n-compatible dictionary with fallback to English defaults.
//
// =============================================================================

import type { Reason, ReasonCode } from '../core/types';

/**
 * Dictionary for reason messages.
 * 
 * Keys are reason codes. Values are either:
 * - A string (used directly)
 * - A function that receives params and returns a string
 */
export type ReasonDictionary = Partial<
  Record<ReasonCode, string | ((params?: Record<string, unknown>) => string)>
>;

/**
 * Default English messages for standard reason codes.
 */
const DEFAULT_DICTIONARY: ReasonDictionary = {
  not_authorized: (params) => {
    const required = params?.required;
    if (Array.isArray(required) && required.length > 0) {
      return `Not authorized. Requires: ${required.join(', ')}`;
    }
    return 'Not authorized';
  },
  
  not_available: (params) => {
    const feature = params?.feature;
    if (feature) {
      return `${feature} is not available`;
    }
    return 'Not available';
  },
  
  invalid_input: (params) => {
    const field = params?.field;
    const message = params?.message;
    if (field && message) {
      return `${field}: ${message}`;
    }
    if (message) {
      return String(message);
    }
    return 'Invalid input';
  },
  
  in_progress: (params) => {
    const operation = params?.operation;
    if (operation) {
      return `${String(operation).charAt(0).toUpperCase() + String(operation).slice(1)} in progress`;
    }
    return 'Operation in progress';
  },
  
  precondition_missing: (params) => {
    const missing = params?.missing;
    const message = params?.message;
    if (message) {
      return String(message);
    }
    if (missing) {
      return `Requires: ${missing}`;
    }
    return 'Prerequisite not met';
  },
  
  conflict: (params) => {
    const state = params?.state;
    const message = params?.message;
    if (message) {
      return String(message);
    }
    if (state) {
      return `Cannot proceed: ${state}`;
    }
    return 'Action not allowed in current state';
  },
  
  not_found: () => 'Not found',
  
  quota_exceeded: (params) => {
    const limit = params?.limit;
    if (limit) {
      return `Limit exceeded: ${limit}`;
    }
    return 'Limit exceeded';
  },
  
  dependency_unavailable: (params) => {
    const service = params?.service;
    if (service) {
      return `${service} is unavailable`;
    }
    return 'Service unavailable';
  },
};

/**
 * Format a single reason into a human-readable string.
 * 
 * @param reason - The reason to format
 * @param dictionary - Optional custom dictionary (merged with defaults)
 * @returns Human-readable string
 */
export function formatReason(
  reason: Reason,
  dictionary?: ReasonDictionary
): string {
  const mergedDictionary = { ...DEFAULT_DICTIONARY, ...dictionary };
  const formatter = mergedDictionary[reason.code];
  
  if (!formatter) {
    // Fallback for unknown codes
    return reason.params?.message 
      ? String(reason.params.message)
      : reason.code.replace(/_/g, ' ');
  }
  
  if (typeof formatter === 'function') {
    return formatter(reason.params);
  }
  
  return formatter;
}

/**
 * Format multiple reasons into human-readable strings.
 * 
 * @param reasons - Array of reasons to format
 * @param dictionary - Optional custom dictionary (merged with defaults)
 * @returns Array of human-readable strings
 * 
 * @example
 * ```typescript
 * const messages = formatReasons(result.reasons);
 * // ['Not authorized. Requires: manage_org', 'Saving in progress']
 * 
 * showToast({ title: 'Cannot submit', messages });
 * ```
 */
export function formatReasons(
  reasons: Reason[],
  dictionary?: ReasonDictionary
): string[] {
  return reasons.map(reason => formatReason(reason, dictionary));
}


