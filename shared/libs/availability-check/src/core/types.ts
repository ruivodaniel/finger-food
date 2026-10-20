// =============================================================================
// AVAILABILITY RESOLVERS - Core Types
// =============================================================================
//
// Minimal, stable types for availability checking with unified reason handling.
// These types describe the "shape" of unavailability, not UI actions.
//
// =============================================================================

// =============================================================================
// REASON CODES
// =============================================================================

/**
 * Standard reason codes describing why something is unavailable.
 * 
 * The (string & {}) pattern allows autocomplete for known codes while 
 * permitting custom codes for app-specific needs.
 * 
 * Codes describe the "shape" of the problem, NOT the UI action.
 */
export type ReasonCode =
  // Core set (must-have)
  | 'not_authorized'         // User lacks role, scope, or entitlement
  | 'not_available'          // Feature/resource not available in this context
  | 'invalid_input'          // Validation failed (form errors, Zod, etc.)
  | 'in_progress'            // Loading, saving, syncing, pending request
  | 'precondition_missing'   // Must do X first (setup, select org, connect integration)
  | 'conflict'               // State conflict: archived, locked, already exists, version mismatch
  
  // Extended set (optional, can fold into above if simpler)
  | 'not_found'              // Resource or route target doesn't exist
  | 'quota_exceeded'         // Plan limit, usage cap, rate limit
  | 'dependency_unavailable' // External system down or disconnected
  
  // App can add custom codes
  | (string & {});

// =============================================================================
// REASON SOURCES
// =============================================================================

/**
 * Where the reason originated.
 * 
 * Keep this small. Implementation details (like "zod") are subsumed 
 * under categories (like "validation").
 */
export type ReasonSource =
  | 'scope'                  // From access control (@prowd/scoped-ac)
  | 'validation'             // From form validation (Zod, etc.)
  | 'ui_state'               // From component state (loading, saving)
  | 'api'                    // From API response
  | 'business_rule'          // From business logic
  | (string & {});           // App can add custom sources

// =============================================================================
// THE REASON SCHEMA
// =============================================================================

/**
 * A single reason why something is unavailable.
 * 
 * Stable, minimal schema. Everything else is app-specific via params.
 */
export interface Reason {
  /** The type of unavailability */
  code: ReasonCode;
  
  /** Where this reason originated */
  source: ReasonSource;
  
  /** Context-specific data (field name, required roles, etc.) */
  params?: Record<string, unknown>;
}

// =============================================================================
// INPUT/OUTPUT TYPES
// =============================================================================

/**
 * Input to the resolver from an adapter.
 */
export interface AvailabilityInput {
  /** Whether this check passed */
  available: boolean;
  
  /** Reasons why not available (empty if available) */
  reasons: Reason[];
}

/**
 * Output from the resolver after merging all inputs.
 */
export interface AvailabilityResult {
  /** Whether ALL checks passed */
  available: boolean;
  
  /** ALL reasons from ALL failing checks */
  reasons: Reason[];
}

// =============================================================================
// REASON KEY (for future dedupe/aggregation)
// =============================================================================

/**
 * Generate a stable key for a reason.
 * 
 * Useful for future dedupe or aggregation. Not used in v0 resolver,
 * but available for apps that want to dedupe manually.
 * 
 * @param reason - The reason to generate a key for
 * @returns A string key that uniquely identifies this reason
 */
export function getReasonKey(reason: Reason): string {
  const paramsKey = reason.params 
    ? Object.keys(reason.params).sort().join(',')
    : '';
  return `${reason.code}:${reason.source}:${paramsKey}`;
}


