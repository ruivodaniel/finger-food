import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import { Icon } from "../../icons";
import type { SheetContentProps } from "./types";

// =============================================================================
// Behavioral wrappers (no visual identity)
// =============================================================================

/** whether the sheet is open: its panel and its scrim say so with a flag, and the theme animates each way.
 *  The sheet is in the page only while open and while it leaves; it enters from outside its edge and leaves the same way */
const OpenContext = React.createContext(true);

function Sheet({ open: given, defaultOpen, onOpenChange, ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [own, setOwn] = React.useState(!!defaultOpen);
  const open = given ?? own;
  return (
    <OpenContext.Provider value={open}>
      <SheetPrimitive.Root open={open} onOpenChange={(next) => { setOwn(next); onOpenChange?.(next); }} {...props} />
    </OpenContext.Provider>
  );
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal {...props} />;
}

// =============================================================================
// Visual components
// =============================================================================

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  const open = React.useContext(OpenContext);
  return (
    <SheetPrimitive.Overlay
      element="overlay--sheet"
      data-part="scrim"
      // the scrim says whether it comes or goes: the theme fades it
      flag={open ? "scrim-in" : "scrim-out"}
      className={cn("fixed inset-0 z-50", className)}
      {...props}
    />
  );
}

function SheetContent({ position,
  className,
  children,
  side = "right",
  emphasis,
  status,
  state,
  scale = "md",
  concept,
  dismissible = true,
  ...props
}: SheetContentProps) {
  const open = React.useContext(OpenContext);
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        element="overlay--sheet"
        // v3: the sheet says the edge it comes from; its size is the theme's, by its scale (no size of its own in the component)
        {...({ side } as object)}
        // it says the edge it comes from, or goes to: the theme moves it in and out (no animation of its own in the component)
        flag={`${open ? "from" : "to"}-${side}`}
        {...axisAttrs({ emphasis, status, scale, concept, state, position })}
        onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
        className={cn(
          // `fixed!`: the theme makes the parent of an absolutely placed thing `relative`; the sheet is that parent for its cross and must stay fixed
          "fixed! z-50 flex flex-col",
          side === "right" && "inset-y-0 right-0",
          side === "left" && "inset-y-0 left-0",
          side === "top" && "inset-x-0 top-0",
          side === "bottom" && "inset-x-0 bottom-0",
          className, positionClasses(position),
        )}
        {...props}>
        {children}
        {/* v4: the cross has no place of its own in the component: it says what it is and the edge its sheet comes from, the theme places it (outside the sheet, on the scrim) */}
        <SheetPrimitive.Close concept={`sheet-close-${side}`} className="disabled:pointer-events-none">
          <Icon name="close" scale="sm" concept="sheet-close" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      className={cn(className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      element="type--body-small"
      emphasis="quiet"
      className={cn(className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
