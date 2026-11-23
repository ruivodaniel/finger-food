import { defineProps } from "../../../../lib/define-props";
import * as React from "react";

import { useIsMobile } from "../../../../hooks/use-mobile";
import { useScrollDirection } from "../../../../lib/scroll-scope";

/** The bar at the top of a shell: a row of navigation entries and menus. It has no look of its own: the theme gives its height, its inset and how it leaves.
 *  `hideOnScroll`: it leaves while the content under it is scrolled down and returns when it is scrolled up; the element then carries the flag `away`. */
function Topbar({ hideOnScroll = false, children, ...props }: React.ComponentProps<"div"> & { hideOnScroll?: boolean }) {
  // the shell it stands in knows which way its body was last scrolled: the bar reads that and listens to nothing.
  // The bar is a row (flex): the theme stands its content on its bottom edge, so as it loses its height the content leaves by the top
  const away = useScrollDirection() === "down" && hideOnScroll;
  return (
    <div element="control-group--topbar" data-slot="topbar" flag={away ? "away" : undefined} className={hideOnScroll ? "flex overflow-hidden" : "flex"} {...props}>
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

const topbarSchema = defineProps<{ hideOnScroll?: boolean }>("Topbar", {
  hideOnScroll: { kind: "boolean", default: false, doc: "The bar leaves while the content under it is scrolled down, and returns when it is scrolled up" },
});
const topbarWhenSchema = defineProps<{ state?: string }>("TopbarWhen", { state: { kind: "string", doc: "desktop or mobile: when its children are shown" } });

export { Topbar, topbarSchema, TopbarWhen, topbarWhenSchema };
