import { cn } from '../../../../lib/utils';
import { iconRegistry, type IconRegistryKey } from './registry';
import { defineProps } from '../../../../lib/define-props';
import { axisAttrs } from '../../../../lib/axes';
import type { Emphasis, Status } from '../../../../../types/axes';

// =============================================================================
// Constants (single source of truth) — aligned with markup dictionary
// =============================================================================

const ICON_SCALES = ["xs", "sm", "md", "lg", "xl"] as const;

// Types derived from constants
export type IconName = IconRegistryKey;
export type IconScale = typeof ICON_SCALES[number];

// Helper to generate typeString from const array
const toTypeString = (arr: readonly string[]) => arr.map(v => `"${v}"`).join(" | ");

// =============================================================================
// Component
// =============================================================================

export interface IconProps {
  /** Semantic icon name */
  name: IconName;
  /** Structural scale (default: "md") */
  scale?: IconScale;
  /** Prominence, read by the theme (v2) */
  emphasis?: Emphasis;
  /** Status colour, read by the theme (v2) */
  status?: Status;
  /** The only state an icon takes */
  state?: "disabled";
  /** Product concept, read by the theme (v2) */
  concept?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
}

export const iconSchema = defineProps<Pick<IconProps, "name" | "scale">>("Icon", {
  name: { kind: "string", required: true, doc: "Semantic icon name (the registry's keys)" },
  scale: { kind: "enum", values: ICON_SCALES, default: "md", doc: "Structural size" },
});

/**
 * Theme-aware icon component with semantic naming.
 *
 * Uses semantic icon names (e.g., "add", "close", "search") that map to
 * the underlying icon library (currently Lucide).
 *
 * @example
 * <Icon name="add" scale="md" />
 * <Icon name="chevronRight" scale="sm" />
 */
export function Icon({
  name,
  scale,
  emphasis,
  status,
  state,
  concept,
  className,
  'aria-label': ariaLabel,
}: IconProps) {
  const IconComponent = iconRegistry[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry`);
    return null;
  }

  return (
    <IconComponent
      element="shape--icon"
      {...axisAttrs({ emphasis, status, state, concept })}
      {...(scale != null && { scale })}
      className={cn(className)}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    />
  );
}

// =============================================================================
// Props Schema (for Cockpit and tooling)
// =============================================================================

const iconNames = Object.keys(iconRegistry) as IconName[];

Icon.propsSchema = {
  componentName: "Icon",
  interfaceName: "IconProps",
  props: [
    {
      name: "name",
      type: "union",
      required: true,
      unionValues: iconNames,
      typeString: "IconName",
      description: "Semantic icon name from the registry",
    },
    {
      name: "size",
      type: "union",
      required: false,
      defaultValue: "md",
      unionValues: ICON_SCALES,
      typeString: toTypeString(ICON_SCALES),
      description: "Structural size",
    },
  ],
};
