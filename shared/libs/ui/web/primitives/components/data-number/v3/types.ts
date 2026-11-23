import type * as React from "react";
import type { Diagnostic, NumberConfig } from "@libs/data-processor";
import type { Emphasis, Status } from "../../../../../types/axes";
import type { IconName } from "../../icons";
import { defineProps } from "../../../../lib/define-props";
import { EMPHASIS, STATUS } from "../../../../../types/axes";

/** The look's size: it picks the typography identity of the whole (numbers-extra-small … numbers-extra-large). */
export type DataNumberScale = "xs" | "sm" | "md" | "lg" | "xl";
/** the only placement property: the symbol goes left or right of the value */
export type DataNumberSymbolPosition = "left" | "right";
/** what opens the tooltip: the pointer resting on the number (a delay applies), or a click */
export type DataNumberTooltipTrigger = "hover" | "click";

/**
 * DataNumber — one number, processed by @libs/data-processor and drawn slot by slot: [trend] [symbol] value [unit] [exponent] [symbol].
 * Fixed places: the value is the centre, the unit is always on its right, the trend always on its left. Only the symbol picks a side.
 * It renders what it receives and never calculates a comparison.
 * The axes (emphasis, status, scale, concept) sit on the root; the theme styles each slot from them and from the slot's own identifier.
 */
export interface DataNumberProps {
  // ── data
  /** the raw value; a decimal string keeps digits a number would lose */
  value: number | string | null | undefined;
  /** how the number is processed: mode, locale, grouping, rounding, representation. Default: the full number. */
  config?: NumberConfig;
  // ── slots
  /** what the number counts: an ISO currency code ("EUR"), a quantity ("kg"). Text, never a symbol character unless asked. */
  symbol?: string;
  /** which side of the value the symbol sits (default right) */
  symbolPosition?: DataNumberSymbolPosition;
  /** an icon on the left of the value: any library icon (a direction, a target). The number does not know why. */
  trend?: IconName;
  // ── behaviour
  /** on by default. true: a data-tooltip with the full value. Content: shown inside a data-tooltip. false (the exception): none, and the consumer may wrap the number in its own tooltip. */
  tooltip?: boolean | React.ReactNode;
  /** what the default tooltip shows when it should not be the full number; default: the full number in the same locale */
  tooltipConfig?: NumberConfig;
  /** milliseconds the pointer rests before the tooltip opens; hover only (default 350) */
  tooltipDelay?: number;
  /** hover (default) or click */
  tooltipTrigger?: DataNumberTooltipTrigger;
  /** shown when the value is empty or not a number (default "–") */
  placeholder?: string;
  /** the processor's warnings, for the consumer */
  onWarnings?: (warnings: Diagnostic[]) => void;
  // ── the axes, on the root
  scale?: DataNumberScale;
  emphasis?: Emphasis;
  /** the semantic state; the theme colours the slots it chooses, per concept */
  status?: Status;
  /** forces the theme's monospace font on every slot, over any other font choice (default false): the consumer knows the numbers are to be compared */
  monospace?: boolean;
  /** a product concept the theme may key on */
  concept?: string;
}

export const DATA_NUMBER_SCALES = ["xs", "sm", "md", "lg", "xl"] as const;
export const dataNumberSchema = defineProps<Omit<DataNumberProps, "onWarnings" | "tooltip">>("DataNumber", {
  value: { kind: "other", required: true, doc: "the raw value: a number, or a decimal string that keeps every digit" },
  config: { kind: "other", doc: "NumberConfig: mode, locale, grouping, rounding, representation, negative" },
  symbol: { kind: "string", doc: "what the number counts: an ISO currency code, a quantity" },
  symbolPosition: { kind: "enum", values: ["left", "right"], default: "right", doc: "which side of the value the symbol sits" },
  trend: { kind: "string", doc: "an icon on the left of the value: any library icon name" },
  tooltipConfig: { kind: "other", doc: "the config of the default tooltip's full value" },
  tooltipDelay: { kind: "number", default: 350, doc: "ms before the hover tooltip opens" },
  tooltipTrigger: { kind: "enum", values: ["hover", "click"], default: "hover" },
  placeholder: { kind: "string", default: "–", doc: "shown when the value is empty or invalid" },
  scale: { kind: "enum", values: DATA_NUMBER_SCALES, default: "md" },
  emphasis: { kind: "enum", values: EMPHASIS, doc: "the form the status colour takes" },
  status: { kind: "enum", values: STATUS, doc: "the colour" },
  monospace: { kind: "boolean", default: false, doc: "forces the theme's monospace font on every slot" },
  concept: { kind: "string", doc: "a product concept the theme may key on" },
});
