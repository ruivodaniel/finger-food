/// <reference path="../../react-overrides.d.ts" />
// v2: each shell is the scroll scope of its layout (lib/scroll-scope): a header in it can leave while its body is scrolled down.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { ScrollScope } from "../../../../lib/scroll-scope";

// Outer row shell — ShellNav + Page sit side by side
export function ShellSideNav({ className, position, children, ...props }: React.ComponentProps<"div">) {
  return <div layout="shell-side-nav" position={position} className={clsx(className, positionClasses(position))} {...props}><ScrollScope window>{children}</ScrollScope></div>;
}

// Nav slot inside ShellSideNav — width comes from its content (surface--sidebar)
export function ShellNav({ className, position, ...props }: React.ComponentProps<"div">) {
  return <div layout="shell-nav" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// Outer column shell — top bar stacks above Page
export function ShellTopNav({ className, position, children, ...props }: React.ComponentProps<"div">) {
  return <div layout="shell-top-nav" position={position} className={clsx(className, positionClasses(position))} {...props}><ScrollScope window>{children}</ScrollScope></div>;
}

// Outer column shell — no navigation chrome
export function ShellNone({ className, position, children, ...props }: React.ComponentProps<"div">) {
  return <div layout="shell-none" position={position} className={clsx(className, positionClasses(position))} {...props}><ScrollScope window>{children}</ScrollScope></div>;
}
