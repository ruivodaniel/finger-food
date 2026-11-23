import { defineProps } from "../../../../lib/define-props";
import * as React from "react";

import { useIsMobile } from "../../../../hooks/use-mobile";

/** The bar at the top of a shell: a row of navigation entries and menus. It has no look of its own: the theme gives its height, its inset and how it leaves.
 *  `away`: the bar goes away when it is told to; it then carries the flag `away`. It does not know why. */
function Topbar({ away, children, ...props }: React.ComponentProps<"div"> & { away?: boolean }) {
  // The bar is a row (flex): the theme stands its content on its bottom edge, so as it loses its height the content leaves by the top
  return (
    <div element="control-group--topbar" data-slot="topbar" flag={away ? "away" : undefined} className={away === undefined ? "flex" : "flex overflow-hidden"} {...props}>
      {children}
    </div>
  );
}

/** Shows what it holds only on one kind of screen: `desktop`, or `mobile` (a phone, where the navigation is a bar with a menu button and a sheet).
 *  It has no look of its own: it draws its children or nothing. */
function TopbarWhen({ state, children }: { state: "desktop" | "mobile"; children?: React.ReactNode }) {
  const isMobile = !!useIsMobile();
  return (state === "mobile") === isMobile ? <>{children}</> : null;
}

const topbarSchema = defineProps<{ away?: boolean }>("Topbar", {
  away: { kind: "boolean", doc: "The bar goes away when told to; it then carries the flag away" },
});
const topbarWhenSchema = defineProps<{ state?: string }>("TopbarWhen", { state: { kind: "string", doc: "desktop or mobile: when its children are shown" } });

export { Topbar, topbarSchema, TopbarWhen, topbarWhenSchema };
