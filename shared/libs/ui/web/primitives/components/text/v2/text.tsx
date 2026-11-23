import * as React from "react";
import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { TextProps } from "./types";

// Text: the one primitive for words in markup. The tag says what it is, `type` says which typography identity the theme paints.
// No colour, size or visual class here: the theme reads element="type--<type>" and the axes.
function Text({ as = "span", type = "body", emphasis, status, concept, position, truncate = false, className, children, ...props }: TextProps) {
  return React.createElement(
    as,
    {
      element: `type--${type}`,
      ...axisAttrs({ emphasis, status, concept, position }),
      className: cn(truncate && "truncate", className, positionClasses(position)) || undefined,
      ...props,
    },
    children,
  );
}

export { Text };
