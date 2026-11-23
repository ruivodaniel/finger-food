/// <reference path="../../react-overrides.d.ts" />
// v3: every region goes away when it is told to (`away`): it then carries the flag `away` and the theme takes it from there. No region reads a scroll:
// a body tells its own scroll as an event (`onScrollDirection`), and who hears it gives the order.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { awayAttrs, awayClass, useTellScroll, type OnScrollDirection } from "../../../../lib/scroll-direction";

export function Main({ className, position, ...props }: React.ComponentProps<"div">) {
  return <div layout="main" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

export interface MainHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  sticky?: boolean;
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function MainHeader({ className, position, scale = "md", sticky = false, away, ...props }: MainHeaderProps) {
  return <div layout="main-header" position={position} scale={scale} {...(sticky && { sticky: "" })} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

// A second full-width row under the main header
export interface SecondMainHeaderProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  sticky?: boolean;
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function SecondMainHeader({ className, position, scale = "md", sticky = false, away, ...props }: SecondMainHeaderProps) {
  return <div layout="second-main-header" position={position} scale={scale} {...(sticky && { sticky: "" })} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

// invisible row holding MainBody + MainRightSidebar
export function MainContent({ className, position, ...props }: React.ComponentProps<"div">) {
  return <div layout="main-content" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

export function MainBody({ className, position, onScrollDirection, ...props }: React.ComponentProps<"div"> & { /** told each time its own scroll turns: "down" or "up" */ onScrollDirection?: OnScrollDirection }) {
  const ref = useTellScroll<HTMLDivElement>(onScrollDirection);
  return <div ref={ref} layout="main-body" position={position} className={clsx(className, positionClasses(position))} {...props} />;
}

export interface MainFooterProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function MainFooter({ className, position, scale = "md", away, ...props }: MainFooterProps) {
  return <div layout="main-footer" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

