import type * as React from "react";
import type { Diagnostic, NumberConfig } from "@libs/data-processor";
import type { Emphasis, Status } from "../../../../../types/axes";

/** The look's size: it picks the typography identity of the whole (numbers-extra-small … numbers-extra-large). */
export type DataNumberScale = "xs" | "sm" | "md" | "lg" | "xl";
export type DataNumberUnitPlacement = "after" | "before" | "hidden";
export type DataNumberAlign = "start" | "end";
/** what opens the tooltip: the pointer resting on the number (a delay applies), or a click */
export type DataNumberTooltipTrigger = "hover" | "click";

/** DataNumber — a number processed by @libs/data-processor and drawn part by part: [leading] [number] [unit] [exponent] [trailing]. The component formats nothing itself. */
export interface DataNumberProps {
  // ── data
  /** the raw value; a decimal string keeps digits a number would lose */
  value: number | string | null | undefined;
  /** how the number is processed: mode, locale, grouping, rounding, representation. Default: the full number. */
  config?: NumberConfig;
  // ── slots
  /** before the number: a currency symbol, an icon */
  leading?: React.ReactNode;
  /** after the unit: a trend arrow, a delta, a badge */
  trailing?: React.ReactNode;
  /** where the unit goes (default after) */
  unitPlacement?: DataNumberUnitPlacement;
  // ── behaviour
  /** on hover, shows the full number (default false) */
  tooltip?: boolean;
  /** what the tooltip shows when it should not be the full number; default: the full number in the same locale */
  tooltipConfig?: NumberConfig;
  /** milliseconds the pointer rests before the tooltip opens; hover only (default 350) */
  tooltipDelay?: number;
  /** hover (default) or click */
  tooltipTrigger?: DataNumberTooltipTrigger;
  /** shown when the value is empty or not a number (default "–") */
  placeholder?: string;
  /** the processor's warnings, for the consumer */
  onWarnings?: (warnings: Diagnostic[]) => void;
  // ── look: the library's axes, as every element
  scale?: DataNumberScale;
  emphasis?: Emphasis;
  /** the semantic state of the value; the theme colours it. The conditional processor will set it from outside. */
  status?: Status;
  /** numbers in a column align to the end (default start) */
  align?: DataNumberAlign;
  /** a product concept the theme may key on */
  concept?: string;
  className?: string;
}
