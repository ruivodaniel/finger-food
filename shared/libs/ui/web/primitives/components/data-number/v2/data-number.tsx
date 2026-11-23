import * as React from "react";
import { processNumber, type Diagnostic, type NumberConfig, type NumberOutput } from "@libs/data-processor";
import { axisAttrs } from "../../../../lib/axes";
import { Stack } from "../../stack/v1/stack";
import { Text } from "../../text/v1/text";
import { Icon } from "../../icons/v1";
import { DataTooltip } from "../../data-tooltip/v1/data-tooltip";
import type { DataNumberProps, DataNumberScale } from "./types";

const FULL: NumberConfig = { mode: { kind: "full" } };
/** the typography identity of each size: the theme paints it */
const TYPE: Record<DataNumberScale, "numbers-extra-small" | "numbers-small" | "numbers" | "numbers-large" | "numbers-extra-large"> = {
  xs: "numbers-extra-small", sm: "numbers-small", md: "numbers", lg: "numbers-large", xl: "numbers-extra-large",
};
const empty = (v: DataNumberProps["value"]) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");
const exponentText = (e: number) => `e${e < 0 ? "−" : ""}${Math.abs(e)}`;

function DataNumber({
  value, config = FULL, symbol, symbolPosition = "right", trend, tooltip = true, tooltipConfig, tooltipDelay = 350, tooltipTrigger = "hover", placeholder = "–", onWarnings,
  scale = "md", emphasis, status, monospace = false, concept,
}: DataNumberProps) {
  const out = React.useMemo(() => (empty(value) ? null : processNumber({ value: value as number | string }, config)), [value, config]);
  // the warnings go to the consumer when they change, never during a render
  const warnings = out?.warnings as Diagnostic[] | undefined;
  const key = JSON.stringify(warnings ?? []);
  React.useEffect(() => { if (warnings?.length) onWarnings?.(warnings); }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps

  const type = TYPE[scale];
  // every number carries the concept "data-number" besides the consumer's own, so a theme rule can name a slot inside any number or inside one concept
  const rootConcept = ["data-number", concept].filter(Boolean).join(" ");
  const mono = monospace ? { style: { fontFamily: "var(--font-mono)" } } : {};
  const invalid = !out || out.value === "";
  const sym = symbol ? <Text type={type} concept="data-number-symbol" {...mono}>{symbol}</Text> : null;
  // a copy inside the number puts the plain value on the clipboard: no grouping, the locale's decimal separator, a hyphen-minus
  const onCopy = (e: React.ClipboardEvent) => {
    if (!out || invalid) return;
    const sel = window.getSelection()?.toString() ?? "";
    if (!sel.trim()) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", out.plain);
  };
  const body = (
    <Stack dir="row" gap={4} align="baseline" onCopy={onCopy} {...(axisAttrs({ emphasis, status, scale, concept: rootConcept }) as object)}>
      {trend ? <span data-part="trend" concept="data-number-trend" style={{ display: "inline-flex", alignItems: "center", alignSelf: "center" }}><Icon name={trend} scale="xs" /></span> : null}
      {symbolPosition === "left" ? sym : null}
      {invalid
        ? <Text type={type} concept="data-number-placeholder" {...mono}>{placeholder}</Text>
        : <Text type={type} concept="data-number-value" {...mono}>{out.value}</Text>}
      {!invalid && out.unit ? <Text type={type} concept="data-number-unit" {...mono}>{out.unit}</Text> : null}
      {!invalid && out.exponent !== undefined ? <Text type={type} concept="data-number-exponent" {...mono}>{exponentText(out.exponent)}</Text> : null}
      {symbolPosition === "right" ? sym : null}
    </Stack>
  );
  if (tooltip === false || tooltip === undefined || tooltip === null || invalid) return body;
  // true: the full value, itself a data-number; content: the consumer's, inside the same data-tooltip frame
  const content = tooltip === true
    ? <DataNumber value={value} config={tooltipConfig ?? { ...FULL, locale: config.locale, representation: config.representation }} symbol={symbol} symbolPosition={symbolPosition} scale="md" />
    : tooltip;
  return (
    <DataTooltip content={content} trigger={tooltipTrigger} delay={tooltipDelay}>
      <span style={{ display: "inline-flex", width: "fit-content" }}>{body}</span>
    </DataTooltip>
  );
}

export { DataNumber };
export type { NumberOutput };
