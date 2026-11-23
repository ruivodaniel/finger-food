/// <reference path="../../react-overrides.d.ts" />
// v3: a region goes away when it is told to (`away`): it then carries the flag `away` and the theme takes it from there. A shell tells the window's
// scroll as an event (`onScrollDirection`); it holds no state and no region reads a scroll.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { awayAttrs, awayClass, useTellWindowScroll, type OnScrollDirection } from "../../../../lib/scroll-direction";

type ShellProps = Omit<React.ComponentProps<"div">, "onScroll"> & { onScrollDirection?: OnScrollDirection };
type AwayProps = React.ComponentProps<"div"> & { /** the region goes away: it carries the flag `away` */ away?: boolean };

// Outer row shell — ShellNav + Page sit side by side
export function ShellSideNav({ className, position, onScrollDirection, ...props }: ShellProps) {
  useTellWindowScroll(onScrollDirection);
  return <div layout="shell-side-nav" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// Outer column shell — top bar stacks above Page
export function ShellTopNav({ className, position, onScrollDirection, ...props }: ShellProps) {
  useTellWindowScroll(onScrollDirection);
  return <div layout="shell-top-nav" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// Outer column shell — no navigation chrome
export function ShellNone({ className, position, onScrollDirection, ...props }: ShellProps) {
  useTellWindowScroll(onScrollDirection);
  return <div layout="shell-none" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

// Nav slot inside ShellSideNav — width comes from its content (surface--sidebar)
export function ShellNav({ className, position, away, ...props }: AwayProps) {
  return <div layout="shell-nav" position={position} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}
