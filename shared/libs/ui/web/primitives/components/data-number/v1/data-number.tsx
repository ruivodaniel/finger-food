import * as React from "react";
import { processNumber, type Diagnostic, type NumberConfig, type NumberOutput } from "@libs/data-processor";
import { cn } from "../../../../lib/utils";
import { Stack } from "../../stack/v1/stack";
import { Text } from "../../text/v1/text";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover/v1/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../tooltip/v1/tooltip";
import type { DataNumberProps, DataNumberScale } from "./types";

const FULL: NumberConfig = { mode: { kind: "full" } };
/** the typography identity of each size: the theme paints it */
const TYPE: Record<DataNumberScale, "numbers-extra-small" | "numbers-small" | "numbers" | "numbers-large" | "numbers-extra-large"> = {
  xs: "numbers-extra-small", sm: "numbers-small", md: "numbers", lg: "numbers-large", xl: "numbers-extra-large",
};
const empty = (v: DataNumberProps["value"]) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
/** a processed number as one line: the number and its unit, for the tooltip */
const line = (o: NumberOutput) => `${o.value}${o.unit ? ` ${o.unit}` : ""}${o.exponent !== undefined ? ` e${o.exponent}` : ""}`;
const exponentText = (e: number) => `e${e < 0 ? "−" : ""}${Math.abs(e)}`;

function DataNumber({
  value, config = FULL, leading, trailing, unitPlacement = "after", tooltip = false, tooltipConfig, tooltipDelay = 350, tooltipTrigger = "hover", placeholder = "–", onWarnings,
  scale = "md", emphasis, status, align = "start", concept, className,
}: DataNumberProps) {
  const out = React.useMemo(() => (empty(value) ? null : processNumber({ value: value as number | string }, config)), [value, config]);
  const full = React.useMemo(() => (tooltip && out && !empty(value) ? processNumber({ value: value as number | string }, tooltipConfig ?? { ...FULL, locale: config.locale, representation: config.representation }) : null), [tooltip, out, value, tooltipConfig, config]);
  // the warnings go to the consumer when they change, never during a render
  const warnings = out?.warnings as Diagnostic[] | undefined;
  const key = JSON.stringify(warnings ?? []);
  React.useEffect(() => { if (warnings?.length) onWarnings?.(warnings); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps

  const type = TYPE[scale];
  const invalid = !out || out.value === "";
  const unit = !invalid && out.unit && unitPlacement !== "hidden"
    ? <Text type={type} emphasis="quiet" concept="data-number-unit">{out.unit}</Text> : null;
  const body = (
    <Stack dir="row" gap={4} align="baseline" className={cn(align === "end" && "justify-end", className)} concept={concept}>
      {leading ? <span concept="data-number-leading" style={{ display: "inline-flex", alignItems: "center" }}>{leading}</span> : null}
      {unitPlacement === "before" ? unit : null}
      {invalid
        ? <Text type={type} emphasis="quiet" concept="data-number-placeholder">{placeholder}</Text>
        : <Text type={type} emphasis={emphasis} status={status} concept="data-number-value">{out.value}</Text>}
      {unitPlacement !== "before" ? unit : null}
      {!invalid && out.exponent !== undefined ? <Text type={type} emphasis="quiet" concept="data-number-exponent">{exponentText(out.exponent)}</Text> : null}
      {trailing ? <span concept="data-number-trailing" style={{ display: "inline-flex", alignItems: "center" }}>{trailing}</span> : null}
    </Stack>
  );
  if (!tooltip || !full || invalid) return body;
  // click: the library popover, opened and closed by clicking the number; hover: the tooltip, after the pointer has rested `tooltipDelay` ms
  if (tooltipTrigger === "click") {
    return (
      <Popover>
        <PopoverTrigger asChild><span style={{ display: "inline-flex", cursor: "pointer" }}>{body}</span></PopoverTrigger>
        <PopoverContent side="top" style={{ width: "auto" }}>{line(full)}</PopoverContent>
      </Popover>
    );
  }
  return (
    <TooltipProvider delayDuration={tooltipDelay}>
      <Tooltip>
        <TooltipTrigger asChild><span style={{ display: "inline-flex" }}>{body}</span></TooltipTrigger>
        <TooltipContent>{line(full)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { DataNumber };
