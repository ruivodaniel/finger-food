import type * as React from "react";
import type { Emphasis, Status } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";
import { EMPHASIS, STATUS } from "../../../../../types/axes";

/** what opens it: the pointer resting on the trigger (a delay applies), or a click */
export type DataTooltipTrigger = "hover" | "click";
export type DataTooltipSide = "top" | "right" | "bottom" | "left";
export type DataTooltipAlign = "start" | "center" | "end";

/** DataTooltip — the data surface: a themed card with an optional header, a body and an optional footer, opened from a trigger. The body takes any content (patterns). */
export interface DataTooltipProps {
  /** the element that opens it: it carries the trigger, the focus and the position */
  children: React.ReactElement;
  /** the title of what is explained (optional) */
  header?: React.ReactNode;
  /** the body: any content, usually a pattern */
  content: React.ReactNode;
  /** a closing line (optional) */
  footer?: React.ReactNode;
  /** hover (default) or click */
  trigger?: DataTooltipTrigger;
  /** milliseconds the pointer rests before it opens; hover only (default 350) */
  delay?: number;
  side?: DataTooltipSide;
  align?: DataTooltipAlign;
  emphasis?: Emphasis;
  status?: Status;
  /** a product concept the theme may key on (default "data-tooltip") */
  concept?: string;
}

export const dataTooltipSchema = defineProps<Omit<DataTooltipProps, "children" | "content" | "header" | "footer">>("DataTooltip", {
  trigger: { kind: "enum", values: ["hover", "click"], default: "hover" },
  delay: { kind: "number", default: 350, doc: "ms before the hover card opens" },
  side: { kind: "enum", values: ["top", "right", "bottom", "left"], default: "top" },
  align: { kind: "enum", values: ["start", "center", "end"], default: "center" },
  emphasis: { kind: "enum", values: EMPHASIS },
  status: { kind: "enum", values: STATUS },
  concept: { kind: "string", default: "data-tooltip" },
});
