import * as React from "react";

import { cn } from "../../../../lib/utils";
import type { CardProps } from "./types";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";

function Card({ position, className, emphasis, status, state, scale, concept, ...props }: CardProps) {
  return (
    <div
      element="surface--card"
      {...axisAttrs({ emphasis, status, scale, concept, state, position })}
      className={cn("flex flex-col overflow-hidden", className, positionClasses(position))}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn(className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div element="type--body-small" emphasis="quiet" className={cn(className)} {...props} />;
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

export { Card, CardAction, CardDescription, CardTitle };
