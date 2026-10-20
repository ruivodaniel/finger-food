// =============================================================================
// GET BUTTON PROPS
// =============================================================================
//
// Maps an AvailabilityResult to props for a Button component.
// Pure function — no React, no UI framework dependency.
//
// =============================================================================

import type { AvailabilityResult } from '../core/types';
import { formatReasons } from '../format/format-reason';

export interface AvailabilityButtonProps {
  disabled: boolean;
  disabledReason: string | undefined;
}

/**
 * Map an availability result to Button component props.
 *
 * Returns `{ disabled, disabledReason }` — spread directly onto a Button
 * that supports the `disabledReason` prop (Tooltip on hover when disabled).
 *
 * @example
 * ```tsx
 * <Button {...getButtonProps(availability)} onClick={...}>
 *   Create Organization
 * </Button>
 * ```
 */
export function getButtonProps(availability: AvailabilityResult): AvailabilityButtonProps {
  return {
    disabled: !availability.available,
    disabledReason: !availability.available
      ? formatReasons(availability.reasons).join(". ")
      : undefined,
  };
}
