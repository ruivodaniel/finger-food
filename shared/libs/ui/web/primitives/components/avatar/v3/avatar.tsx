import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import { AvatarGenerator } from "../../avatar-generator";
import type { AvatarFallbackProps, AvatarProps, AvatarPicture } from "./types";

// =============================================================================
// Components
// =============================================================================

function Avatar({ position, className, emphasis, status, state, scale = "md", concept, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      element="surface--avatar"
      {...axisAttrs({ emphasis, status, scale, concept, state, position })}
      className={cn("relative flex shrink-0 overflow-hidden", className, positionClasses(position))}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      className={cn("absolute inset-0 h-full w-full object-cover object-top", className)}
      {...props}
    />
  );
}

// what an avatar shows: its image when it has one; with no image, its initials. `picture` on one avatar asks for a generated picture drawn from the seed in their place
// (the AvatarGenerator's kinds). A theme may ask for generated pictures for every avatar that says nothing (its variables are read on the element itself:
// --avatar-fallback: generated, --avatar-fallback-picture).
/** It shows its children (the initials). With a `seed` (the id of who it stands for) and a `picture` asked, it draws that picture from the seed: the same seed, the same picture. */
function AvatarFallback({ className, seed, picture, children, ...props }: AvatarFallbackProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [asked, setAsked] = React.useState<AvatarPicture>(seed && picture !== "initials" ? (picture ?? "initials") : "initials");
  React.useLayoutEffect(() => {
    if (!seed || picture === "initials") { setAsked("initials"); return; }
    if (picture) { setAsked(picture); return; }
    if (!ref.current) return;
    // not said on this avatar: initials, unless the theme asks for generated pictures
    const css = getComputedStyle(ref.current);
    setAsked(css.getPropertyValue("--avatar-fallback").trim() === "generated" ? ((css.getPropertyValue("--avatar-fallback-picture").trim() as AvatarPicture) || "marble") : "initials");
  }, [seed, picture]);
  return (
    <AvatarPrimitive.Fallback ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
      {asked === "initials" || !seed ? children : <AvatarGenerator seed={seed} picture={asked} />}
    </AvatarPrimitive.Fallback>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
