// =============================================================================
// FROM ZOD ADAPTER
// =============================================================================
//
// Transform Zod validation errors into availability input.
// Source is 'validation', not 'zod' — Zod is an implementation detail.
//
// =============================================================================

import type { AvailabilityInput, Reason } from '../core/types';

/**
 * Zod error shape (minimal interface to avoid hard dependency).
 * 
 * If you need the full ZodError type, import from 'zod'.
 */
export interface ZodErrorLike {
  issues: Array<{
    path: (string | number)[];
    message: string;
    code?: string;
  }>;
}

/**
 * Create availability input from a Zod validation error.
 * 
 * If no error → available
 * If error → unavailable with one reason per field
 * 
 * Source is 'validation', not 'zod' — so you could swap validators
 * without changing reason handling.
 * 
 * @param error - ZodError or null/undefined if no error
 * @returns AvailabilityInput
 * 
 * @example
 * ```typescript
 * const parseResult = schema.safeParse(formData);
 * 
 * const availability = fromZod(parseResult.success ? null : parseResult.error);
 * // { available: false, reasons: [
 * //   { code: 'invalid_input', source: 'validation', params: { field: 'email', message: 'Invalid email' } },
 * //   { code: 'invalid_input', source: 'validation', params: { field: 'name', message: 'Required' } }
 * // ]}
 * ```
 */
export function fromZod(error: ZodErrorLike | null | undefined): AvailabilityInput {
  if (!error || !error.issues || error.issues.length === 0) {
    return { available: true, reasons: [] };
  }
  
  const reasons: Reason[] = error.issues.map(issue => ({
    code: 'invalid_input' as const,
    source: 'validation' as const,
    params: {
      field: issue.path.join('.'),
      message: issue.message,
      zodCode: issue.code,
    },
  }));
  
  return {
    available: false,
    reasons,
  };
}


