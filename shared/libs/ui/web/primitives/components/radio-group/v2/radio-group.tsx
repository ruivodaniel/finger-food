import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { RadioGroupProps, RadioGroupItemProps } from "./types";

// =============================================================================
// RadioGroup — the container
// =============================================================================

// v2: the group shares its current value, so each item can emit state="selected" for the theme
// (Radix only sets data-state, which the theme does not read).
const RadioValueContext = React.createContext<string | undefined>(undefined);
// v2: the group's scale reaches its items (an item written without one follows the group)
const RadioScaleContext = React.createContext<string | undefined>(undefined);
/** the dot per scale (the theme colours it through the inner's foreground) */
const DOT: Record<string, string> = { "3xs": "0.2rem", "2xs": "0.25rem", xs: "0.3rem", sm: "0.35rem", md: "0.4rem", lg: "0.5rem", xl: "0.6rem", "2xl": "0.7rem", "3xl": "0.8rem" };

function RadioGroup({ position,
  emphasis,
  status,
  state,
  concept,
  className,
  scale = "md",
  orientation,
  value: valueProp,
  defaultValue,
  onValueChange,
  ...props
}: RadioGroupProps) {
  const [internal, setInternal] = React.useState<string | undefined>(defaultValue);
  const current = valueProp ?? internal;
  const themeAttrs: Record<string, string | undefined> = {
    element: "control-group--choice-group",
    ...axisAttrs({ emphasis, status, scale, concept, state, position }),
    ...(orientation && { orientation }),
  };

  return (
    <RadioValueContext.Provider value={current}>
    <RadioScaleContext.Provider value={scale}>
      <RadioGroupPrimitive.Root
        {...themeAttrs}
        className={cn("flex flex-col", className, positionClasses(position))}
        orientation={orientation}
        value={valueProp}
        defaultValue={defaultValue}
        onValueChange={(v) => { if (valueProp === undefined) setInternal(v); onValueChange?.(v); }}
        {...props}
      />
    </RadioScaleContext.Provider>
    </RadioValueContext.Provider>
  );
}

// =============================================================================
// RadioGroupItem — one radio button
// =============================================================================

function RadioGroupItem({ 
  state,
  concept,
  className,
  emphasis = "primary",
  status,
  scale: scaleProp,
  checked: checkedProp,
  disabled,
  ...props
}: RadioGroupItemProps) {
  const groupValue = React.useContext(RadioValueContext);
  const scale = (scaleProp ?? React.useContext(RadioScaleContext) ?? "md") as NonNullable<typeof scaleProp>;
  const checked = checkedProp ?? (groupValue !== undefined && groupValue === props.value);
  const themeAttrs: Record<string, string | undefined> = {
    element: "control--radio",
    ...axisAttrs({ emphasis, status, scale, concept, state: disabled ? "disabled" : checked ? "selected" : state }),
  };

  return (
    <RadioGroupPrimitive.Item
      {...themeAttrs}
      className={cn(
        "peer shrink-0 inline-flex items-center justify-center disabled:pointer-events-none disabled:cursor-not-allowed",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {/* The inner is always rendered so the outer's size does not depend on
          whether a dot is inside. Radix's Indicator inside it paints only when
          this item is the current value in the RadioGroup context. */}
      <span
        element="surface--radio-inner"
        {...axisAttrs({ state: checked ? "selected" : undefined })}
        className="rounded-full overflow-hidden"
        style={{
          display: "block",
          width: `var(--radio-indicator-size, ${DOT[scale] ?? DOT.md})`,
          height: `var(--radio-indicator-size, ${DOT[scale] ?? DOT.md})`,
          flexShrink: 0,
        }}
      >
        <RadioGroupPrimitive.Indicator
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            borderRadius: 9999,
            backgroundColor: "var(--fg, var(--primary))",
          }}
        />
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
