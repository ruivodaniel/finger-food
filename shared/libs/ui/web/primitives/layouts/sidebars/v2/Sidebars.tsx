/// <reference path="../../react-overrides.d.ts" />
// v3: every region goes away when it is told to (`away`): it then carries the flag `away` and the theme takes it from there. No region reads a scroll:
// a body tells its own scroll as an event (`onScrollDirection`), and who hears it gives the order.
import * as React from "react";
import { clsx } from "clsx";
import { positionClasses } from "../../position";
import { awayAttrs, awayClass } from "../../../../lib/scroll-direction";

// The sidebars, named by the zone they belong to: the page's two columns beside main, and main's own right column.

export interface PageLeftSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  collapsed?: boolean;
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function PageLeftSidebar({ className, position, scale = "md", collapsed = false, away, ...props }: PageLeftSidebarProps) {
  return <div layout="page-left-sidebar" position={position} scale={scale} {...(collapsed && { state: "collapsed" })} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

export interface PageRightSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function PageRightSidebar({ className, position, scale = "md", away, ...props }: PageRightSidebarProps) {
  return <div layout="page-right-sidebar" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

export interface MainRightSidebarProps extends React.ComponentProps<"div"> {
  scale?: "sm" | "md" | "lg";
  /** the region goes away: it carries the flag `away` */
  away?: boolean;
}

export function MainRightSidebar({ className, position, scale = "md", away, ...props }: MainRightSidebarProps) {
  return <div layout="main-right-sidebar" position={position} scale={scale} {...awayAttrs(away)} className={clsx(className, positionClasses(position), awayClass(away))} {...props} />;
}

