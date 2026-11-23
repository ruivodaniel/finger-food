// Contract: shape--icon (ui/types/elements.ts) · mirrors @libs/web-components Icon, 0.1.0
import type { ScaleOf } from "../../../../../types/elements";
import { useElement, useTheme } from "../../theme";
import { iconRegistry, type IconRegistryKey } from "./registry";

export type IconName = IconRegistryKey;
export type IconScale = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps {
  /** Semantic icon name */
  name: IconName;
  /** Structural size (default: "md") */
  size?: IconScale & ScaleOf<"icon">;
  /** the colour: absent = the icon element's own; a parent passes the colour of its text */
  color?: string;
  /** stroke width: absent = the theme's */
  weight?: number;
  /** a size in points, when a parent's scale decides it */
  points?: number;
  accessibilityLabel?: string;
}

/** A themed icon by its semantic name ("add", "close", "search"), on the theme's icon set. */
export function Icon({ name, size = "md", color, weight, points, accessibilityLabel }: IconProps) {
  const { theme } = useTheme();
  const el = useElement("icon");
  const IconComponent = iconRegistry[name];
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={points ?? theme.icons?.sizes[size] ?? 20}
      color={color ?? el.color ?? "currentColor"}
      strokeWidth={weight ?? theme.icons?.weight ?? 2}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
