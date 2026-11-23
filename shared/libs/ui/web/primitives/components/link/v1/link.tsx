import * as React from "react";
import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { LinkProps } from "./types";

// Link: the one <a> in markup. Router-agnostic: spread a router's link props (href, onClick…) onto it.
function Link({ type = "link", emphasis, status, concept, position, className, children, ...props }: LinkProps) {
  return (
    <a
      element={`type--${type}`}
      {...axisAttrs({ emphasis, status, concept, position })}
      className={cn(className, positionClasses(position)) || undefined}
      {...props}
    >
      {children}
    </a>
  );
}

export { Link };
