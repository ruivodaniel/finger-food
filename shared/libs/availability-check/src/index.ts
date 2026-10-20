// =============================================================================
// @libs/availability-check
// =============================================================================
//
// Minimal utility for availability checks with unified reason handling.
//
// Core output: { available: boolean, reasons: Reason[] }
//
// The library provides data. The application decides what to render.
//
// =============================================================================

// Core
export { resolveAvailability } from './core/resolve';
export {
  type ReasonCode,
  type ReasonSource,
  type Reason,
  type AvailabilityInput,
  type AvailabilityResult,
  getReasonKey,
} from './core/types';

// Adapters
export { fromBoolean } from './adapters/from-boolean';
export { fromZod, type ZodErrorLike } from './adapters/from-zod';
export { createFromScope } from './adapters/from-scope';

// Format
export {
  formatReason,
  formatReasons,
  type ReasonDictionary,
} from './format/format-reason';

// Helpers
export {
  getButtonProps,
  type AvailabilityButtonProps,
} from './helpers/get-button-props';
export {
  createAvailabilityCheck,
  type AvailabilityCheckResult,
} from './helpers/create-availability-check';


