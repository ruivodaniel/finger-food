import * as React from "react";
import { Stack } from "../../stack/v1/stack";
import { Popover, PopoverContent, PopoverTrigger } from "../../popover/v1/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../hover-card/v1/hover-card";
import type { DataTooltipProps } from "./types";

/** the card's inside: header, body, footer. Every part is its own element for the theme (data-tooltip-header, -body, -footer). */
function DataTooltipSurface({ header, content, footer }: Pick<DataTooltipProps, "header" | "content" | "footer">) {
  return (
    <Stack dir="col" gap={8}>
      {header ? <div data-part="header" concept="data-tooltip-header">{header}</div> : null}
      <div data-part="body" concept="data-tooltip-body">{content}</div>
      {footer ? <div data-part="footer" concept="data-tooltip-footer">{footer}</div> : null}
    </Stack>
  );
}

function DataTooltip({ children, header, content, footer, trigger = "hover", delay = 350, side = "top", align = "center", emphasis, status, concept = "data-tooltip" }: DataTooltipProps) {
  const surface = <DataTooltipSurface header={header} content={content} footer={footer} />;
  if (trigger === "click") {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent side={side} align={align} emphasis={emphasis} status={status} concept={concept} style={{ width: "auto" }}>{surface}</PopoverContent>
      </Popover>
    );
  }
  // hover: a hover card, not a tooltip: it stays open while the pointer is on it, so the text can be selected and copied
  return (
    <HoverCard openDelay={delay} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side={side} align={align} emphasis={emphasis} status={status} concept={concept} style={{ width: "auto" }}>{surface}</HoverCardContent>
    </HoverCard>
  );
}

export { DataTooltip, DataTooltipSurface };
